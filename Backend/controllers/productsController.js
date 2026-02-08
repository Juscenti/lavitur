// Backend/controllers/productsController.js
import { supabaseAdmin, supabaseWithUserToken, getProductMediaPublicUrl } from '../config/supabase.js';

/** Public: published products with categories and primary image for shop */
export async function listPublicProducts(req, res) {
  try {
    const { data: prodRows, error: prodErr } = await supabaseAdmin
      .from('products')
      .select(`
        id, title, price, stock, status, created_at,
        product_media (file_path, media_type, is_primary, position)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (prodErr) throw prodErr;

    const productIds = (prodRows || []).map((p) => p.id);
    if (productIds.length === 0) {
      return res.json([]);
    }

    const { data: links, error: linkErr } = await supabaseAdmin
      .from('product_categories')
      .select('product_id, category_id')
      .in('product_id', productIds);

    if (linkErr) throw linkErr;

    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug');

    const catById = new Map((categories || []).map((c) => [c.id, c]));
    const prodToCat = new Map((links || []).map((l) => [l.product_id, l.category_id]));

    const list = (prodRows || []).map((p) => {
      const catId = prodToCat.get(p.id);
      const cat = catId ? catById.get(catId) : null;
      const slug = cat?.slug || (cat?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'uncategorized';
      const media = (p.product_media || []).sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.position ?? 0) - (b.position ?? 0);
      });
      const primary = media.find((m) => m.media_type === 'image') || media[0];
      const image_url = primary ? getProductMediaPublicUrl(primary.file_path) : '';

      return {
        id: p.id,
        title: p.title || 'Untitled',
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? 0),
        image_url,
        category_slug: slug,
      };
    });

    res.json(list);
  } catch (err) {
    console.error('listPublicProducts:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
}

/** Admin: all products with media and category names */
export async function listAdminProducts(req, res) {
  try {
    const { data: prodRows, error: prodErr } = await supabaseAdmin
      .from('products')
      .select(`
        id, title, description, price, stock, status, created_at, updated_at,
        product_media (id, file_path, media_type, is_primary, position)
      `)
      .order('created_at', { ascending: false });

    if (prodErr) throw prodErr;

    const { data: catRows } = await supabaseAdmin.from('categories').select('id, name');
    const { data: links } = await supabaseAdmin.from('product_categories').select('product_id, category_id');

    const catById = new Map((catRows || []).map((c) => [c.id, c.name]));
    const prodToCat = new Map((links || []).map((l) => [l.product_id, l.category_id]));

    const list = (prodRows || []).map((p) => {
      const catName = catById.get(prodToCat.get(p.id)) || 'Unassigned';
      const media = p.product_media || [];
      const primary = media.find((m) => m.is_primary && m.media_type === 'image') || media.find((m) => m.media_type === 'image');
      const thumbUrl = primary ? getProductMediaPublicUrl(primary.file_path) : null;

      return {
        id: p.id,
        name: p.title,
        description: p.description ?? '',
        price: p.price,
        stock: p.stock ?? '',
        status: p.status,
        published: p.status === 'published',
        category: catName,
        thumbUrl,
        product_media: media,
      };
    });

    res.json(list);
  } catch (err) {
    console.error('listAdminProducts:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
}

/** Admin: create product — use user JWT so DB triggers (e.g. role check) see auth.uid() */
export async function createProduct(req, res) {
  try {
    const { title, description, price, stock, categoryName } = req.body;
    const userId = req.userId;
    const authHeader = req.headers.authorization;
    const supabase = supabaseWithUserToken(authHeader);

    const { data: inserted, error } = await supabase
      .from('products')
      .insert({
        title: title || 'Untitled',
        description: description || null,
        price: price ?? 0,
        stock: stock ?? 0,
        status: 'pending',
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) throw error;

    if (categoryName && categoryName !== 'Unassigned') {
      const { data: cats } = await supabaseAdmin.from('categories').select('id').eq('name', categoryName).limit(1);
      if (cats?.[0]) {
        await supabaseAdmin.from('product_categories').insert({ product_id: inserted.id, category_id: cats[0].id });
      }
    }

    res.status(201).json({ id: inserted.id });
  } catch (err) {
    console.error('createProduct:', err);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
}

/** Admin: update product — use user JWT so DB triggers see auth.uid() */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, stock, categoryName } = req.body;
    const supabase = supabaseWithUserToken(req.headers.authorization);

    const { error } = await supabase
      .from('products')
      .update({
        title,
        description: description ?? null,
        price,
        stock,
      })
      .eq('id', id);

    if (error) throw error;

    await supabaseAdmin.from('product_categories').delete().eq('product_id', id);
    if (categoryName && categoryName !== 'Unassigned') {
      const { data: cats } = await supabaseAdmin.from('categories').select('id').eq('name', categoryName).limit(1);
      if (cats?.[0]) {
        await supabaseAdmin.from('product_categories').insert({ product_id: id, category_id: cats[0].id });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('updateProduct:', err);
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
}

/** Admin: update product status — use user JWT so DB triggers see auth.uid() */
export async function updateProductStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['draft', 'pending', 'published', 'archived'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const supabase = supabaseWithUserToken(req.headers.authorization);
    const { error } = await supabase.from('products').update({ status }).eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('updateProductStatus:', err);
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
}

/** Admin: delete product — use user JWT so DB triggers see auth.uid() */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const supabase = supabaseWithUserToken(req.headers.authorization);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteProduct:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
}

// ---------- Product media (admin) ----------
const BUCKET = 'product-media';

export async function listProductMedia(req, res) {
  try {
    const { id: productId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    const list = (data || []).map((row) => ({
      ...row,
      public_url: getProductMediaPublicUrl(row.file_path),
    }));
    res.json(list);
  } catch (err) {
    console.error('listProductMedia:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch media' });
  }
}

export async function uploadProductMedia(req, res) {
  try {
    const { id: productId } = req.params;
    const files = req.files || [];
    const makeFirstImagePrimary = req.body?.makeFirstImagePrimary === 'true';

    if (!files.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = (file.originalname || 'file').replace(/\s+/g, '-');
      const filePath = `products/${productId}/${crypto.randomUUID()}-${safeName}`;
      const mediaType = (file.mimetype || '').startsWith('video/') ? 'video' : 'image';

      const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

      if (upErr) throw upErr;

      const isPrimary = makeFirstImagePrimary && i === 0 && mediaType === 'image';
      const { data: row, error: dbErr } = await supabaseAdmin
        .from('product_media')
        .insert({
          product_id: productId,
          file_path: filePath,
          media_type: mediaType,
          position: 0,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;
      uploaded.push({ ...row, public_url: getProductMediaPublicUrl(row.file_path) });
    }

    res.status(201).json(uploaded);
  } catch (err) {
    console.error('uploadProductMedia:', err);
    res.status(500).json({ error: err.message || 'Failed to upload media' });
  }
}

export async function deleteProductMedia(req, res) {
  try {
    const { id: productId, mediaId } = req.params;

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('product_media')
      .select('file_path')
      .eq('id', mediaId)
      .eq('product_id', productId)
      .single();

    if (fetchErr || !row) return res.status(404).json({ error: 'Media not found' });

    await supabaseAdmin.storage.from(BUCKET).remove([row.file_path]);
    const { error: dbErr } = await supabaseAdmin.from('product_media').delete().eq('id', mediaId);
    if (dbErr) throw dbErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteProductMedia:', err);
    res.status(500).json({ error: err.message || 'Failed to delete media' });
  }
}

export async function setPrimaryMedia(req, res) {
  try {
    const { id: productId, mediaId } = req.params;

    await supabaseAdmin.from('product_media').update({ is_primary: false }).eq('product_id', productId);
    const { error } = await supabaseAdmin.from('product_media').update({ is_primary: true }).eq('id', mediaId).eq('product_id', productId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('setPrimaryMedia:', err);
    res.status(500).json({ error: err.message || 'Failed to set primary' });
  }
}
