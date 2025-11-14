import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [newProspect, setNewProspect] = useState({
    name: '',
    phone: '',
    website: '',
    city: '',
    category: '',
    rating: 0,
    reviews: 0,
    notes: ''
  });

  const [importData, setImportData] = useState({
    items: [],
    fileName: '',
    city: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prospectsRes, statsRes] = await Promise.all([
        fetch('/api/prospects'),
        fetch('/api/stats')
      ]);

      let prospectsData = [];
      try {
        const parsed = await prospectsRes.json();
        prospectsData = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Failed to parse prospects', err);
      }

      let statsData = {};
      try {
        const parsed = await statsRes.json();
        statsData = parsed || {};
      } catch (err) {
        console.error('Failed to parse stats', err);
      }

      setProspects(prospectsData);
      setStats(statsData);
    } catch (error) {
      showMessage('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAddProspect = async (e) => {
    e.preventDefault();
    if (!newProspect.name.trim()) {
      showMessage('Le nom est requis', 'error');
      return;
    }

    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect)
      });

      if (res.ok) {
        showMessage('Prospect ajouté ✅');
        setNewProspect({ name: '', phone: '', website: '', city: '', category: '', rating: 0, reviews: 0, notes: '' });
        setShowAddForm(false);
        loadData();
      } else {
        const err = await res.json();
        showMessage(err.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      showMessage('Erreur réseau', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        let items = [];
        if (Array.isArray(parsed)) items = parsed;
        else if (Array.isArray(parsed.items)) items = parsed.items;
        else if (Array.isArray(parsed.data)) items = parsed.data;
        else {
          showMessage('Format JSON invalide', 'error');
          return;
        }
        setImportData({ items, fileName: file.name, city: '' });
      } catch (err) {
        showMessage('Erreur: JSON invalide', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.items.length) {
      showMessage('Aucun fichier sélectionné', 'error');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importData.items, city: importData.city || null })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        showMessage('Erreur serveur', 'error');
        return;
      }

      if (!res.ok) {
        showMessage(data?.error || 'Erreur lors de l\'import', 'error');
      } else {
        showMessage(`Importé: ${data.inserted || 0} prospects ✅`);
        setImportData({ items: [], fileName: '', city: '' });
        setShowImportForm(false);
        loadData();
      }
    } catch (err) {
      showMessage('Erreur réseau', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleMarkContacted = async (id) => {
    try {
      await fetch('/api/prospects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, contacted: true, contact_date: new Date().toISOString(), status: 'contacté' })
      });
      showMessage('Marqué comme contacté ✅');
      loadData();
    } catch (error) {
      showMessage('Erreur', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr?')) return;
    try {
      await fetch('/api/prospects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      showMessage('Prospect supprimé ✅');
      loadData();
    } catch (error) {
      showMessage('Erreur', 'error');
    }
  };

  const safeProspects = Array.isArray(prospects) ? prospects : [];
  const filteredProspects = safeProspects.filter(p => {
    if (filter === 'contacter') return p.is_prospect_to_contact && !p.contacted;
    if (filter === 'siteweb') return p.has_website;
    if (filter === 'contactes') return p.contacted;
    return true;
  });

  if (loading) {
    return <div style={styles.loadingContainer}><h2>Chargement...</h2></div>;
  }

  return (
    <>
      <Head>
        <title>ProspectHub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.title}>📊 ProspectHub</h1>
          <p style={styles.subtitle}>Gestion des prospects • Identifiez qui contacter</p>
        </div>
      </header>

      {message && <div style={{ ...styles.toast, ...(messageType === 'error' ? styles.toastError : styles.toastSuccess) }}>{message}</div>}

      <main style={styles.container}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total || 0}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#ff6b6b' }}>{stats.prospectContacter || 0}</div>
            <div style={styles.statLabel}>À Contacter 🎯</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#51cf66' }}>{stats.avecSiteWeb || 0}</div>
            <div style={styles.statLabel}>Avec Site Web</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#4c6ef5' }}>{stats.contactes || 0}</div>
            <div style={styles.statLabel}>Contactés</div>
          </div>
        </div>

        <div style={styles.actionButtons}>
          <button style={styles.primaryBtn} onClick={() => { setShowAddForm(!showAddForm); setShowImportForm(false); }}>
            ➕ Ajouter
          </button>
          <button style={styles.secondaryBtn} onClick={() => { setShowImportForm(!showImportForm); setShowAddForm(false); }}>
            📥 Importer
          </button>
        </div>

        {showAddForm && (
          <div style={styles.form}>
            <h2>Nouveau Prospect</h2>
            <form onSubmit={handleAddProspect}>
              <div style={styles.formGrid}>
                <input placeholder="Nom *" value={newProspect.name} onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })} required style={styles.input} />
                <input placeholder="Téléphone" value={newProspect.phone} onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })} style={styles.input} />
                <input placeholder="Site Web" value={newProspect.website} onChange={(e) => setNewProspect({ ...newProspect, website: e.target.value })} style={styles.input} />
                <input placeholder="Ville" value={newProspect.city} onChange={(e) => setNewProspect({ ...newProspect, city: e.target.value })} style={styles.input} />
                <input placeholder="Catégorie" value={newProspect.category} onChange={(e) => setNewProspect({ ...newProspect, category: e.target.value })} style={styles.input} />
                <input type="number" placeholder="Note" step="0.1" min="0" max="5" value={newProspect.rating} onChange={(e) => setNewProspect({ ...newProspect, rating: parseFloat(e.target.value) || 0 })} style={styles.input} />
              </div>
              <textarea placeholder="Notes" value={newProspect.notes} onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })} rows={3} style={styles.textarea} />
              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryBtn}>✅ Ajouter</button>
                <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelBtn}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {showImportForm && (
          <div style={styles.form}>
            <h2>Importer JSON</h2>
            <input type="file" accept="application/json" onChange={handleFileChange} style={styles.fileInput} />
            {importData.fileName && <p style={styles.fileName}>Fichier: {importData.fileName} • {importData.items.length} objets</p>}
            <input placeholder="Ville (optionnel)" value={importData.city} onChange={(e) => setImportData({ ...importData, city: e.target.value })} style={styles.input} />
            <div style={styles.formActions}>
              <button onClick={handleImport} disabled={importing || !importData.items.length} style={{ ...styles.primaryBtn, opacity: importing ? 0.6 : 1 }}>
                {importing ? 'Import en cours...' : '📥 Importer'}
              </button>
              <button onClick={() => setShowImportForm(false)} style={styles.cancelBtn}>Annuler</button>
            </div>
          </div>
        )}

        <div style={styles.filterBar}>
          <button style={{ ...styles.filterBtn, ...(filter === 'all' ? styles.filterBtnActive : {}) }} onClick={() => setFilter('all')}>
            📌 Tous ({safeProspects.length})
          </button>
          <button style={{ ...styles.filterBtn, ...(filter === 'contacter' ? styles.filterBtnActive : {}) }} onClick={() => setFilter('contacter')}>
            🎯 À Contacter ({safeProspects.filter(p => p.is_prospect_to_contact && !p.contacted).length})
          </button>
          <button style={{ ...styles.filterBtn, ...(filter === 'siteweb' ? styles.filterBtnActive : {}) }} onClick={() => setFilter('siteweb')}>
            🌐 Site Web ({safeProspects.filter(p => p.has_website).length})
          </button>
          <button style={{ ...styles.filterBtn, ...(filter === 'contactes' ? styles.filterBtnActive : {}) }} onClick={() => setFilter('contactes')}>
            ✅ Contactés ({safeProspects.filter(p => p.contacted).length})
          </button>
        </div>

        {filteredProspects.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>Aucun prospect</h3>
            <p>Commencez par ajouter ou importer des prospects</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Ville</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Site</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Catégorie</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((p) => (
                  <tr key={p.id} style={styles.tableRow}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>
                      {p.name}
                      {p.is_prospect_to_contact && !p.contacted && <div style={styles.badge}>🎯 À CONTACTER</div>}
                    </td>
                    <td style={{ padding: '12px' }}>{p.phone || '—'}</td>
                    <td style={{ padding: '12px' }}>{p.city || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      {p.has_website ? <a href={p.website} target="_blank" rel="noopener" style={styles.link}>🌐</a> : p.is_third_party ? <span style={styles.badgeSecondary}>📱</span> : '❌'}
                    </td>
                    <td style={{ padding: '12px' }}>{p.category}</td>
                    <td style={{ padding: '12px' }}>⭐ {p.rating}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={p.contacted ? styles.badgeSuccess : styles.badgeInfo}>
                        {p.contacted ? '✅' : '🆕'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', display: 'flex', gap: '6px' }}>
                      {!p.contacted && p.is_prospect_to_contact && <button onClick={() => handleMarkContacted(p.id)} style={styles.actionBtnContact}>✓</button>}
                      <button onClick={() => handleDelete(p.id)} style={styles.actionBtnDelete}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  title: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' },
  subtitle: { fontSize: '0.95rem', opacity: 0.9 },
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '14px 20px', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '500', zIndex: 1000 },
  toastSuccess: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
  toastError: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' },
  statLabel: { fontSize: '0.85rem', color: '#666', fontWeight: '500' },
  actionButtons: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  primaryBtn: { padding: '12px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
  secondaryBtn: { padding: '12px 20px', background: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
  cancelBtn: { padding: '10px 16px', background: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' },
  form: { background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%' },
  textarea: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%', marginBottom: '16px' },
  fileInput: { marginBottom: '12px', fontSize: '0.95rem' },
  fileName: { marginBottom: '12px', fontSize: '0.9rem', color: '#666' },
  formActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  filterBar: { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  filterBtn: { padding: '10px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' },
  filterBtnActive: { background: '#667eea', color: 'white', borderColor: '#667eea' },
  emptyState: { background: 'white', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', color: '#999' },
  tableWrapper: { background: 'white', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8f9fa', borderBottom: '2px solid #dee2e6' },
  tableRow: { borderBottom: '1px solid #dee2e6' },
  badge: { display: 'inline-block', background: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', marginTop: '6px' },
  badgeSecondary: { display: 'inline-block', background: '#fff3e0', color: '#e65100', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' },
  badgeSuccess: { display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' },
  badgeInfo: { display: 'inline-block', background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' },
  link: { color: '#667eea', textDecoration: 'none', fontWeight: '600' },
  actionBtnContact: { padding: '6px 10px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  actionBtnDelete: { padding: '6px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }
};
