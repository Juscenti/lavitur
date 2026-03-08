import { useState, useEffect } from 'react';

const CONFIRM_WORD = 'DELETE';

export default function ConfirmDeleteModal({ open, onClose, onConfirm, title, bodyLabel }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  if (!open) return null;

  const canConfirm = typed === CONFIRM_WORD;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    const result = onConfirm();
    if (result && typeof result.then === 'function') {
      try {
        await result;
        onClose();
      } catch (_) {
        // Let the parent handle error (e.g. alert); keep modal open
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="confirm-delete-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div className="confirm-delete-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="confirm-delete-modal">
        <h2 id="confirm-delete-title" className="confirm-delete-title">{title}</h2>
        <p className="confirm-delete-body">
          This action cannot be undone. Type <strong>{CONFIRM_WORD}</strong> below to confirm.
        </p>
        <input
          type="text"
          className="confirm-delete-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
          aria-label={`Type ${CONFIRM_WORD} to confirm`}
        />
        <div className="confirm-delete-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
