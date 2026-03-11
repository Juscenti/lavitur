import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  listContentBlocks,
  getContentBlock,
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
  reorderContentBlocks,
  uploadContentImage,
} from '../lib/contentBlocks.js';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import '../styles/content.css';

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero' },
  { value: 'homepage_section', label: 'Homepage section' },
  { value: 'banner', label: 'Banner' },
  { value: 'collections', label: 'Collections' },
  { value: 'split', label: 'Split (e.g. Women / Men)' },
  { value: 'top_picks', label: 'Top Picks heading' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'faq', label: 'FAQ' },
  { value: 'guide', label: 'Guide' },
];

const BLOCK_PAGES = [
  { value: '', label: 'Any / Global' },
  { value: 'home', label: 'Home' },
];

function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || '';
}

function Status({ loading, error }) {
  if (loading) return <p className="content-status">Loading content…</p>;
  if (error) return <p className="content-status content-status--error">{error}</p>;
  return null;
}

function SortableRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'content-table-row--dragging' : ''}>
      <td className="content-table-cell-drag">
        <span className="content-drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
          ⋮⋮
        </span>
      </td>
      <td className="content-table-cell-thumb">
        {item.media_url ? (
          <img src={item.media_url} alt="" className="content-thumb" />
        ) : (
          <span className="content-thumb-placeholder">—</span>
        )}
      </td>
      <td>{item.type}</td>
      <td>{item.slug}</td>
      <td>{item.title}</td>
      <td>{item.is_active ? 'Yes' : 'No'}</td>
      <td>{item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}</td>
      <td className="content-table-cell-actions">
        <button type="button" className="btn btn-small" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(item)}>
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function Content() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState('hero');
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formCtaLabel, setFormCtaLabel] = useState('');
  const [formCtaUrl, setFormCtaUrl] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPage, setFormPage] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    setError('');
    listContentBlocks({ type: typeFilter || undefined, search: search.trim() || undefined })
      .then(setItems)
      .catch((err) => setError(err?.message || 'Failed to load content.'))
      .finally(() => setLoading(false));
  }, [typeFilter, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(items, oldIndex, newIndex).map((i) => i.id);
    reorderContentBlocks(newOrder)
      .then(() => setItems((prev) => arrayMove(prev, oldIndex, newIndex)))
      .catch((err) => setError(err?.message || 'Failed to reorder'));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormType('hero');
    setFormSlug('');
    setFormTitle('');
    setFormBody('');
    setFormMediaUrl('');
    setFormCtaLabel('');
    setFormCtaUrl('');
    setFormActive(true);
    setFormPage('');
    setFormSortOrder('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormError('');
    setModalOpen(true);
    getContentBlock(item.id)
      .then((block) => {
        setFormType(block.type || 'hero');
        setFormSlug(block.slug || '');
        setFormTitle(block.title || '');
        setFormBody(block.body || '');
        setFormMediaUrl(block.media_url || '');
        setFormCtaLabel(block.cta_label || '');
        setFormCtaUrl(block.cta_url || '');
        setFormActive(block.is_active !== false);
        setFormPage(block.page != null ? String(block.page) : '');
        setFormSortOrder(block.sort_order != null ? String(block.sort_order) : '');
      })
      .catch((err) => setFormError(err?.message || 'Failed to load block'));
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleTitleBlur = () => {
    if (!editingId && formTitle && !formSlug) setFormSlug(slugify(formTitle));
  };

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageUploading(true);
    try {
      const url = await uploadContentImage(file);
      if (url) setFormMediaUrl(url);
    } catch (err) {
      setFormError(err?.message || 'Image upload failed');
    } finally {
      setImageUploading(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onPaste = useCallback((e) => {
    const item = e.clipboardData?.items?.[0];
    if (item?.kind === 'file' && item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) handleFile(file);
    }
  }, [handleFile]);

  useEffect(() => {
    if (!modalOpen) return;
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [modalOpen, onPaste]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formSlug.trim() || !formTitle.trim() || !formType) {
      setFormError('Type, slug, and title are required.');
      return;
    }
    setFormSubmitting(true);
    try {
      const payload = {
        slug: formSlug.trim(),
        title: formTitle.trim(),
        type: formType,
        body: formBody.trim() || null,
        media_url: formMediaUrl.trim() || null,
        cta_label: formCtaLabel.trim() || null,
        cta_url: formCtaUrl.trim() || null,
        is_active: formActive,
        sort_order: formSortOrder.trim() && Number.isFinite(Number(formSortOrder)) ? parseInt(formSortOrder, 10) : undefined,
        page: formPage.trim() || null,
      };
      if (editingId) {
        await updateContentBlock(editingId, payload);
      } else {
        await createContentBlock(payload);
      }
      closeModal();
      fetchList();
    } catch (err) {
      setFormError(err?.message || 'Failed to save block');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDeleteModal = (item) => {
    setBlockToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!blockToDelete) return;
    setDeleting(true);
    try {
      await deleteContentBlock(blockToDelete.id);
      setDeleteModalOpen(false);
      setBlockToDelete(null);
      fetchList();
    } catch (err) {
      setError(err?.message || 'Failed to delete block');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h1>Content Management</h1>
          <p className="panel-subtitle">
            Hero banners, homepage sections, FAQs and other reusable content blocks.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          + New block
        </button>
      </header>

      <div className="panel-filters">
        <label>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            {BLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            placeholder="Title or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <Status loading={loading} error={error} />

      {!loading && !error && (
        <div className="table-wrapper content-table-wrapper">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="data-table content-table">
              <thead>
                <tr>
                  <th className="content-table-cell-drag" aria-label="Reorder" />
                  <th className="content-table-cell-thumb">Image</th>
                  <th>Type</th>
                  <th>Slug</th>
                  <th>Title</th>
                  <th>Active</th>
                  <th>Last updated</th>
                  <th className="content-table-cell-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center' }}>
                      No content blocks found.
                    </td>
                  </tr>
                ) : (
                  <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        onEdit={openEdit}
                        onDelete={openDeleteModal}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      )}

      {modalOpen && (
        <div className="content-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="content-modal-title">
          <div className="content-modal-backdrop" onClick={closeModal} aria-hidden="true" />
          <div className="content-modal">
            <header className="content-modal-header">
              <h2 id="content-modal-title">{editingId ? 'Edit content block' : 'New content block'}</h2>
              <button type="button" className="content-modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </header>
            <form onSubmit={handleSubmit} className="content-modal-form">
              <div className="content-modal-body">
                {formError && <p className="content-form-error">{formError}</p>}
                <div className="content-form-row">
                  <label htmlFor="content-type">Type *</label>
                  <select
                    id="content-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required
                  >
                    {BLOCK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-slug">Slug *</label>
                  <input
                    id="content-slug"
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. hero-main"
                    required
                  />
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-title">Title *</label>
                  <input
                    id="content-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Block title"
                    required
                  />
                  <span className="content-form-hint">Leave slug empty to auto-generate from title.</span>
                </div>
                <div className="content-form-row">
                  <label>Body</label>
                  <textarea
                    id="content-body"
                    rows={5}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Markdown or plain text…"
                  />
                  <span className="content-form-hint">Supports markdown.</span>
                </div>
                <div className="content-form-row">
                  <label>Image</label>
                  <div
                    className={`content-dropzone ${imageUploading ? 'content-dropzone--busy' : ''} ${formMediaUrl ? 'content-dropzone--has-image' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    onClick={() => !formMediaUrl && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !formMediaUrl && fileInputRef.current?.click()}
                    aria-label="Add or replace image"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="content-dropzone-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = '';
                      }}
                      aria-hidden="true"
                    />
                    {imageUploading && <span className="content-dropzone-status">Uploading…</span>}
                    {!imageUploading && formMediaUrl && (
                      <div className="content-dropzone-preview">
                        <img src={formMediaUrl} alt="" />
                        <div className="content-dropzone-actions">
                          <button type="button" className="btn btn-small" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            Replace
                          </button>
                          <button type="button" className="btn btn-small btn-danger" onClick={(e) => { e.stopPropagation(); setFormMediaUrl(''); }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    {!imageUploading && !formMediaUrl && (
                      <span className="content-dropzone-text">Drop image, paste, or click to upload</span>
                    )}
                  </div>
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-cta-label">CTA label</label>
                  <input
                    id="content-cta-label"
                    type="text"
                    value={formCtaLabel}
                    onChange={(e) => setFormCtaLabel(e.target.value)}
                    placeholder="Button text"
                  />
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-cta-url">CTA URL</label>
                  <input
                    id="content-cta-url"
                    type="url"
                    value={formCtaUrl}
                    onChange={(e) => setFormCtaUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="content-form-row content-form-row--inline">
                  <label className="content-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-page">Page</label>
                  <select
                    id="content-page"
                    value={formPage}
                    onChange={(e) => setFormPage(e.target.value)}
                  >
                    {BLOCK_PAGES.map((p) => (
                      <option key={p.value || 'any'} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <span className="content-form-hint">e.g. Home = show on frontend home page.</span>
                </div>
                <div className="content-form-row">
                  <label htmlFor="content-sort">Sort order</label>
                  <input
                    id="content-sort"
                    type="number"
                    min={0}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <footer className="content-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving…' : 'Save'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setBlockToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete content block?"
        bodyLabel={blockToDelete ? `"${blockToDelete.title}"` : ''}
        deleting={deleting}
        confirmPayload={blockToDelete}
      />
    </section>
  );
}
