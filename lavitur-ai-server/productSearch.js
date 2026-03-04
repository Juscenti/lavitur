// Product search utility for AI queries
const { supabaseAdmin } = require('./config');

/**
 * Search products based on filters extracted from user query
 * @param {Object} filters - { categories: [], gender: string, colors: [], search: string }
 * @returns {Promise<Array>} - Array of matching products with details
 */
async function searchProducts(filters = {}) {
  try {
    const { categories = [], gender, colors = [], search = '' } = filters;

    // Start with base query for published products
    let query = supabaseAdmin
      .from('products')
      .select(`
        id, 
        title, 
        description, 
        price, 
        stock, 
        created_at,
        product_media (file_path, media_type, is_primary),
        product_categories (
          category:categories(id, name, slug)
        )
      `)
      .eq('status', 'published');

    // Filter by search text if provided - escape special characters for Supabase
    if (search.trim()) {
      const escapedSearch = search
        .replace(/[?]/g, '') // Remove question marks
        .replace(/[\\]/g, '\\\\')
        .trim();
      
      if (escapedSearch) {
        query = query.or(`title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`);
      }
    }

    const { data: products, error } = await query.limit(10);

    if (error) {
      console.error('Database error:', error);
      return [];
    }

    // Post-process results to include category names and format for AI
    const formattedProducts = (products || []).map((product) => {
      const categoryNames = (product.product_categories || [])
        .map((pc) => pc.category?.name)
        .filter(Boolean);

      const primaryImage = (product.product_media || []).find((m) => m.is_primary);
      const imageUrl = primaryImage 
        ? `${process.env.SUPABASE_URL}/storage/v1/object/public/product-media/${primaryImage.file_path}`
        : '';

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categories: categoryNames,
        image: imageUrl,
        inStock: product.stock > 0,
      };
    });

    // Post-filter by categories if specified
    let filtered = formattedProducts;
    if (categories.length > 0) {
      filtered = formattedProducts.filter((p) =>
        categories.some((cat) =>
          p.categories.some((pcat) => pcat.toLowerCase().includes(cat.toLowerCase()))
        )
      );
    }

    return filtered;
  } catch (err) {
    console.error('Search products error:', err);
    return [];
  }
}

/**
 * Extract product search intent from user message
 * Returns filters suitable for searchProducts()
 */
function extractSearchFilters(message) {
  const lowerMsg = message.toLowerCase();
  const filters = { search: '', categories: [], gender: null, colors: [] };

  // Gender detection
  if (/\b(men|men's|mens)\b/.test(lowerMsg)) {
    filters.gender = 'men';
  } else if (/\b(women|women's|womens)\b/.test(lowerMsg)) {
    filters.gender = 'women';
  }

  // Category/style detection
  const styleKeywords = {
    gothic: ['gothic', 'dark', 'black metal', 'emo'],
    casual: ['casual', 'everyday', 'comfort'],
    formal: ['formal', 'suit', 'dress', 'elegant'],
    vintage: ['vintage', 'retro'],
    streetwear: ['streetwear', 'street'],
    athletic: ['athletic', 'sport', 'fitness'],
  };

  Object.entries(styleKeywords).forEach(([style, keywords]) => {
    if (keywords.some((kw) => lowerMsg.includes(kw))) {
      filters.categories.push(style);
    }
  });

  // Color detection
  const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'pink', 'purple', 'gray', 'grey', 'gold', 'silver'];
  colorKeywords.forEach((color) => {
    if (lowerMsg.includes(color)) {
      filters.colors.push(color);
    }
  });

  // Use entire message as search if no specific filters extracted
  if (filters.categories.length === 0 && filters.colors.length === 0 && !filters.gender) {
    filters.search = message;
  } else {
    // Or combine keywords for search
    filters.search = message.replace(/(men's?|women's?|shirts?|pants?|clothing?)/gi, '').trim();
  }

  return filters;
}

module.exports = { searchProducts, extractSearchFilters };
