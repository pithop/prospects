import React, { useState } from 'react';

export default function TableView({ prospects, onEdit, onDelete, onContact }) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === prospects.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(prospects.map(p => p.id)));
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Nouveau': '#3b82f6',
      'À Contacter': '#f59e0b',
      'Contacté': '#10b981',
      'Perdu': '#6b7280',
      'Gagné': '#8b5cf6',
    };
    
    const color = statusColors[status] || '#9ca3af';
    
    return (
      <span style={{
        ...styles.statusBadge,
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
      }}>
        {status || 'Non défini'}
      </span>
    );
  };

  if (prospects.length === 0) {
    return (
      <div style={styles.emptyState}>
        <span style={styles.emptyIcon}>📋</span>
        <h3 style={styles.emptyTitle}>Aucun prospect à afficher</h3>
        <p style={styles.emptyText}>Les prospects apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === prospects.length && prospects.length > 0}
                  onChange={toggleAll}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.headerCell}>Nom</th>
              <th style={styles.headerCell}>Ville</th>
              <th style={styles.headerCell}>Catégorie</th>
              <th style={styles.headerCell}>Note</th>
              <th style={styles.headerCell}>Statut</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr 
                key={prospect.id} 
                style={{
                  ...styles.row,
                  ...(selectedRows.has(prospect.id) ? styles.selectedRow : {})
                }}
              >
                <td style={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(prospect.id)}
                    onChange={() => toggleRow(prospect.id)}
                    style={styles.checkbox}
                  />
                </td>
                <td style={styles.cell}>
                  <div style={styles.nameCell}>
                    <span style={styles.name}>{prospect.name}</span>
                    {prospect.phone && (
                      <span style={styles.phone}>📞 {prospect.phone}</span>
                    )}
                  </div>
                </td>
                <td style={styles.cell}>{prospect.city || '-'}</td>
                <td style={styles.cell}>{prospect.category || '-'}</td>
                <td style={styles.cell}>
                  {prospect.rating ? (
                    <div style={styles.ratingCell}>
                      <span style={styles.ratingValue}>{prospect.rating}</span>
                      <span style={styles.ratingStar}>⭐</span>
                      {prospect.reviews && (
                        <span style={styles.reviewCount}>({prospect.reviews})</span>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td style={styles.cell}>
                  {getStatusBadge(prospect.status)}
                </td>
                <td style={styles.cell}>
                  <div style={styles.actions}>
                    {!prospect.contacted && (
                      <button
                        onClick={() => onContact(prospect)}
                        style={styles.actionButton}
                        title="Marquer comme contacté"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(prospect)}
                      style={styles.actionButton}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(prospect)}
                      style={{...styles.actionButton, ...styles.deleteButton}}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  headerRow: {
    background: '#fafafa',
    borderBottom: '2px solid #e5e5e5',
  },
  headerCell: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
  },
  checkboxCell: {
    padding: '14px 16px',
    width: '40px',
    textAlign: 'center',
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  },
  row: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.15s ease',
  },
  selectedRow: {
    background: '#f5f5f5',
  },
  cell: {
    padding: '14px 16px',
    color: '#1a1a1a',
  },
  nameCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    fontWeight: '500',
    color: '#1a1a1a',
  },
  phone: {
    fontSize: '0.85rem',
    color: '#666',
  },
  ratingCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  ratingValue: {
    fontWeight: '500',
  },
  ratingStar: {
    fontSize: '0.85rem',
  },
  reviewCount: {
    fontSize: '0.8rem',
    color: '#666',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '6px',
  },
  actionButton: {
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  deleteButton: {
    borderColor: '#dc262620',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyText: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#666',
  },
};
