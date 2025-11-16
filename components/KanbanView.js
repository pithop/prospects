import React, { useState, useMemo } from 'react';

export default function KanbanView({ prospects, onStatusChange }) {
  const [draggingProspect, setDraggingProspect] = useState(null);
  
  // Define status columns (can be dynamic based on unique status values)
  const statusColumns = useMemo(() => {
    const statuses = ['Nouveau', 'À Contacter', 'Contacté', 'Perdu', 'Gagné'];
    
    // Group prospects by status
    const columns = statuses.map(status => ({
      status,
      prospects: prospects.filter(p => (p.status || 'Nouveau') === status)
    }));
    
    return columns;
  }, [prospects]);

  const handleDragStart = (e, prospect) => {
    setDraggingProspect(prospect);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggingProspect) return;
    
    // Don't update if same status
    if ((draggingProspect.status || 'Nouveau') === newStatus) {
      setDraggingProspect(null);
      return;
    }

    // Call parent handler to update status in database
    await onStatusChange(draggingProspect.id, newStatus);
    setDraggingProspect(null);
  };

  const getColumnColor = (status) => {
    const colors = {
      'Nouveau': '#3b82f6',
      'À Contacter': '#f59e0b',
      'Contacté': '#10b981',
      'Perdu': '#6b7280',
      'Gagné': '#8b5cf6',
    };
    return colors[status] || '#9ca3af';
  };

  return (
    <div style={styles.container}>
      <div style={styles.board}>
        {statusColumns.map(column => {
          const color = getColumnColor(column.status);
          
          return (
            <div
              key={column.status}
              style={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div style={{
                ...styles.columnHeader,
                background: `${color}10`,
                borderBottom: `3px solid ${color}`,
              }}>
                <h3 style={styles.columnTitle}>{column.status}</h3>
                <span style={{
                  ...styles.columnCount,
                  background: color,
                }}>{column.prospects.length}</span>
              </div>

              {/* Column Content */}
              <div style={styles.columnContent}>
                {column.prospects.length === 0 ? (
                  <div style={styles.emptyColumn}>
                    <span style={styles.emptyIcon}>📋</span>
                    <p style={styles.emptyText}>Aucun prospect</p>
                  </div>
                ) : (
                  column.prospects.map(prospect => (
                    <div
                      key={prospect.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, prospect)}
                      style={{
                        ...styles.card,
                        opacity: draggingProspect?.id === prospect.id ? 0.5 : 1,
                      }}
                    >
                      <div style={styles.cardHeader}>
                        <h4 style={styles.cardTitle}>{prospect.name}</h4>
                        {prospect.is_prospect_to_contact && !prospect.contacted && (
                          <span style={styles.priorityBadge}>🎯</span>
                        )}
                      </div>

                      {prospect.city && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardIcon}>📍</span>
                          <span style={styles.cardText}>{prospect.city}</span>
                        </div>
                      )}

                      {prospect.category && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardIcon}>🏷️</span>
                          <span style={styles.cardText}>{prospect.category}</span>
                        </div>
                      )}

                      {prospect.phone && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardIcon}>📞</span>
                          <span style={styles.cardText}>{prospect.phone}</span>
                        </div>
                      )}

                      {prospect.rating && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardIcon}>⭐</span>
                          <span style={styles.cardText}>
                            {prospect.rating}
                            {prospect.reviews && ` (${prospect.reviews} avis)`}
                          </span>
                        </div>
                      )}

                      {prospect.contacted && (
                        <div style={styles.contactedBadge}>
                          ✓ Contacté
                          {prospect.contact_date && (
                            <span style={styles.contactDate}>
                              {' le ' + new Date(prospect.contact_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  board: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    padding: '8px',
    minHeight: '600px',
  },
  column: {
    flex: '0 0 300px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
  },
  columnHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '12px 12px 0 0',
  },
  columnTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  columnCount: {
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  columnContent: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '8px',
    opacity: 0.5,
  },
  emptyText: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#999',
  },
  card: {
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '14px',
    cursor: 'grab',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  priorityBadge: {
    fontSize: '1rem',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '0.85rem',
  },
  cardIcon: {
    fontSize: '0.9rem',
  },
  cardText: {
    color: '#666',
  },
  contactedBadge: {
    marginTop: '10px',
    padding: '6px 10px',
    background: '#10b98110',
    border: '1px solid #10b98140',
    borderRadius: '6px',
    fontSize: '0.8rem',
    color: '#10b981',
    fontWeight: '500',
  },
  contactDate: {
    fontSize: '0.75rem',
    color: '#059669',
  },
};
