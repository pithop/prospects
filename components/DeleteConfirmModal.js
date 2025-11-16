import React, { useState } from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, prospectName }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText === 'pithop') {
      onConfirm();
      setConfirmText('');
      setError('');
    } else {
      setError('Texte incorrect. Tapez exactement "pithop" pour confirmer.');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>⚠️ Confirmer la suppression</h3>
          <button onClick={handleClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.content}>
          <p style={styles.warningText}>
            Vous êtes sur le point de supprimer définitivement le prospect <strong>{prospectName}</strong>.
          </p>
          <p style={styles.instructionText}>
            Pour confirmer la suppression, tapez <code style={styles.code}>pithop</code> dans le champ ci-dessous :
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError('');
            }}
            placeholder="Tapez 'pithop' pour confirmer"
            style={styles.input}
            autoFocus
          />

          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.footer}>
          <button onClick={handleClose} style={styles.cancelButton}>
            Annuler
          </button>
          <button 
            onClick={handleConfirm} 
            style={styles.confirmButton}
            disabled={confirmText !== 'pithop'}
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.75rem',
    color: '#666',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.15s ease',
  },
  content: {
    padding: '24px',
  },
  warningText: {
    margin: '0 0 16px 0',
    fontSize: '0.95rem',
    color: '#1a1a1a',
    lineHeight: '1.5',
  },
  instructionText: {
    margin: '0 0 16px 0',
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: '1.5',
  },
  code: {
    background: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
    color: '#dc2626',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontFamily: 'monospace',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  error: {
    margin: '12px 0 0 0',
    fontSize: '0.85rem',
    color: '#dc2626',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e5e5',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  confirmButton: {
    background: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    opacity: 1,
  },
};
