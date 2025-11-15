import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'city', 'rating', 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedCity, setSelectedCity] = useState(''); // For city filter

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
    
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Rechercher"]')?.focus();
      }
      // Cmd/Ctrl + N for new prospect
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddForm(true);
        setShowImportForm(false);
      }
      // Cmd/Ctrl + I for import
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setShowImportForm(true);
        setShowAddForm(false);
      }
      // Escape to close forms
      if (e.key === 'Escape') {
        setShowAddForm(false);
        setShowImportForm(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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

  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Nom', 'Téléphone', 'Ville', 'Site Web', 'Catégorie', 'Note', 'Statut', 'Contacté'];
    const csvData = filteredProspects.map(p => [
      p.name || '',
      p.phone || '',
      p.city || '',
      p.website || '',
      p.category || '',
      p.rating || 0,
      p.is_prospect_to_contact ? 'À contacter' : (p.has_website ? 'Site web' : 'Autre'),
      p.contacted ? 'Oui' : 'Non'
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prospects_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage(`${filteredProspects.length} prospects exportés ✅`);
  };

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = Array.isArray(prospects) 
      ? [...new Set(prospects.map(p => p.city).filter(Boolean))]
      : [];
    return cities.sort();
  }, [prospects]);

  const safeProspects = Array.isArray(prospects) ? prospects : [];
  
  // Advanced filtering with search
  const filteredProspects = useMemo(() => {
    let filtered = safeProspects.filter(p => {
      // Category filter
      if (filter === 'contacter') {
        if (!p.is_prospect_to_contact || p.contacted) return false;
      } else if (filter === 'siteweb') {
        if (!p.has_website) return false;
      } else if (filter === 'contactes') {
        if (!p.contacted) return false;
      }

      // City filter
      if (selectedCity && p.city !== selectedCity) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(query);
        const matchPhone = p.phone?.toLowerCase().includes(query);
        const matchCity = p.city?.toLowerCase().includes(query);
        const matchCategory = p.category?.toLowerCase().includes(query);
        const matchWebsite = p.website?.toLowerCase().includes(query);
        const matchNotes = p.notes?.toLowerCase().includes(query);
        
        return matchName || matchPhone || matchCity || matchCategory || matchWebsite || matchNotes;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'city':
          aVal = a.city?.toLowerCase() || '';
          bVal = b.city?.toLowerCase() || '';
          break;
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'date':
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        default:
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [safeProspects, filter, searchQuery, sortBy, sortOrder]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <h2 style={styles.loadingText}>Chargement...</h2>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ProspectHub - Gestion de Prospects Professionnelle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Application moderne de gestion de prospects commerciaux" />
      </Head>

      <style jsx global>{`
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .card-hover {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }

        button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button:hover {
          transform: translateY(-2px);
        }

        button:active {
          transform: translateY(0);
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.title}>📊 ProspectHub</h1>
              <p style={styles.subtitle}>Gestion professionnelle de vos prospects</p>
            </div>
            <div style={styles.keyboardHints}>
              <div style={styles.hint}>⌘K Rechercher</div>
              <div style={styles.hint}>⌘N Nouveau</div>
              <div style={styles.hint}>⌘I Importer</div>
            </div>
          </div>
        </div>
      </header>

      {message && <div style={{ ...styles.toast, ...(messageType === 'error' ? styles.toastError : styles.toastSuccess) }}>{message}</div>}

      <main style={styles.container}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, ...styles.statCardPrimary }} className="card-hover">
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statValue}>{stats.total || 0}</div>
            <div style={styles.statLabel}>Total Prospects</div>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardDanger }} className="card-hover">
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statValue}>{stats.prospectContacter || 0}</div>
            <div style={styles.statLabel}>À Contacter</div>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardSuccess }} className="card-hover">
            <div style={styles.statIcon}>🌐</div>
            <div style={styles.statValue}>{stats.avecSiteWeb || 0}</div>
            <div style={styles.statLabel}>Avec Site Web</div>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardInfo }} className="card-hover">
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue}>{stats.contactes || 0}</div>
            <div style={styles.statLabel}>Contactés</div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div style={styles.searchBar}>
          <div style={styles.searchInputWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, ville, catégorie, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                style={styles.clearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {uniqueCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={styles.cityFilter}
            >
              <option value="">Toutes les villes</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
          <div style={styles.actionButtonsCompact}>
            <button style={styles.primaryBtn} onClick={() => { setShowAddForm(!showAddForm); setShowImportForm(false); }}>
              ➕ Ajouter
            </button>
            <button style={styles.secondaryBtn} onClick={() => { setShowImportForm(!showImportForm); setShowAddForm(false); }}>
              📥 Importer
            </button>
            {filteredProspects.length > 0 && (
              <button style={styles.exportBtn} onClick={handleExportCSV} title="Exporter en CSV">
                📊 Exporter
              </button>
            )}
          </div>
        </div>

        {/* View Controls */}
        <div style={styles.controlsBar}>
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
          
          <div style={styles.viewControls}>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="name">Trier par nom</option>
              <option value="city">Trier par ville</option>
              <option value="rating">Trier par note</option>
              <option value="date">Trier par date</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={styles.sortOrderBtn}
              title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <div style={styles.viewModeToggle}>
              <button 
                onClick={() => setViewMode('grid')}
                style={{ ...styles.viewModeBtn, ...(viewMode === 'grid' ? styles.viewModeBtnActive : {}) }}
                title="Vue grille"
              >
                ▦
              </button>
              <button 
                onClick={() => setViewMode('table')}
                style={{ ...styles.viewModeBtn, ...(viewMode === 'table' ? styles.viewModeBtnActive : {}) }}
                title="Vue tableau"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Forms remain the same */}
        {showAddForm && (
          <div style={styles.form} className="card-hover">
            <h2 style={styles.formTitle}>Nouveau Prospect</h2>
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
          <div style={styles.form} className="card-hover">
            <h2 style={styles.formTitle}>Importer JSON</h2>
            <input type="file" accept="application/json" onChange={handleFileChange} style={styles.fileInput} />
            {importData.fileName && <p style={styles.fileName}>📁 {importData.fileName} • {importData.items.length} objets</p>}
            <input placeholder="Ville (optionnel)" value={importData.city} onChange={(e) => setImportData({ ...importData, city: e.target.value })} style={styles.input} />
            <div style={styles.formActions}>
              <button onClick={handleImport} disabled={importing || !importData.items.length} style={{ ...styles.primaryBtn, opacity: importing ? 0.6 : 1 }}>
                {importing ? 'Import en cours...' : '📥 Importer'}
              </button>
              <button onClick={() => setShowImportForm(false)} style={styles.cancelBtn}>Annuler</button>
            </div>
          </div>
        )}

        {/* Results Info */}
        {searchQuery && (
          <div style={styles.resultsInfo}>
            {filteredProspects.length} résultat{filteredProspects.length !== 1 ? 's' : ''} pour "{searchQuery}"
          </div>
        )}

        {/* Prospects Display */}
        {filteredProspects.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucun prospect'}
            </h3>
            <p style={styles.emptyText}>
              {searchQuery 
                ? 'Essayez de modifier votre recherche' 
                : 'Commencez par ajouter ou importer des prospects'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={styles.primaryBtn}>
                Effacer la recherche
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={styles.gridView}>
            {filteredProspects.map((p) => (
              <div key={p.id} style={styles.prospectCard} className="card-hover">
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{p.name}</h3>
                  {p.is_prospect_to_contact && !p.contacted && (
                    <div style={styles.priorityBadge}>🎯 PRIORITÉ</div>
                  )}
                </div>
                
                <div style={styles.cardBody}>
                  {p.city && (
                    <div style={styles.cardRow}>
                      <span style={styles.cardLabel}>📍 Ville:</span>
                      <span style={styles.cardValue}>{p.city}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div style={styles.cardRow}>
                      <span style={styles.cardLabel}>📞 Téléphone:</span>
                      <span style={styles.cardValue}>{p.phone}</span>
                    </div>
                  )}
                  {p.category && (
                    <div style={styles.cardRow}>
                      <span style={styles.cardLabel}>🏷️ Catégorie:</span>
                      <span style={styles.cardValue}>{p.category}</span>
                    </div>
                  )}
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>⭐ Note:</span>
                    <span style={styles.cardValue}>{p.rating || 0}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>🌐 Site:</span>
                    <span style={styles.cardValue}>
                      {p.has_website ? (
                        <a href={p.website} target="_blank" rel="noopener" style={styles.link}>Visiter</a>
                      ) : p.is_third_party ? (
                        <span style={styles.badgeSecondary}>Réseau social</span>
                      ) : (
                        <span style={styles.badgeDanger}>Pas de site</span>
                      )}
                    </span>
                  </div>
                  {p.notes && (
                    <div style={styles.cardNotes}>
                      <span style={styles.cardLabel}>📝 Notes:</span>
                      <p style={styles.notesText}>{p.notes}</p>
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.cardStatus}>
                    <span style={p.contacted ? styles.badgeSuccess : styles.badgeInfo}>
                      {p.contacted ? '✅ Contacté' : '🆕 Nouveau'}
                    </span>
                  </div>
                  <div style={styles.cardActions}>
                    {!p.contacted && p.is_prospect_to_contact && (
                      <button onClick={() => handleMarkContacted(p.id)} style={styles.actionBtnContact} title="Marquer comme contacté">
                        ✓
                      </button>
                    )}
                    <button onClick={() => handleDelete(p.id)} style={styles.actionBtnDelete} title="Supprimer">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Téléphone</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Ville</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Site</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Catégorie</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Note</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Statut</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((p) => (
                  <tr key={p.id} style={styles.tableRow}>
                    <td style={{ padding: '16px 12px', fontWeight: '600' }}>
                      {p.name}
                      {p.is_prospect_to_contact && !p.contacted && <div style={styles.badge}>🎯 À CONTACTER</div>}
                    </td>
                    <td style={{ padding: '16px 12px' }}>{p.phone || '—'}</td>
                    <td style={{ padding: '16px 12px' }}>{p.city || '—'}</td>
                    <td style={{ padding: '16px 12px' }}>
                      {p.has_website ? <a href={p.website} target="_blank" rel="noopener" style={styles.link}>🌐 Visiter</a> : p.is_third_party ? <span style={styles.badgeSecondary}>📱 Réseau</span> : <span style={styles.badgeDanger}>❌</span>}
                    </td>
                    <td style={{ padding: '16px 12px' }}>{p.category || '—'}</td>
                    <td style={{ padding: '16px 12px' }}>⭐ {p.rating || 0}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={p.contacted ? styles.badgeSuccess : styles.badgeInfo}>
                        {p.contacted ? '✅ Contacté' : '🆕 Nouveau'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!p.contacted && p.is_prospect_to_contact && <button onClick={() => handleMarkContacted(p.id)} style={styles.actionBtnContact} title="Marquer comme contacté">✓</button>}
                        <button onClick={() => handleDelete(p.id)} style={styles.actionBtnDelete} title="Supprimer">✕</button>
                      </div>
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
  loadingContainer: { 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    color: 'white',
    fontSize: '1.4rem',
    fontWeight: '600',
  },
  header: { 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    color: 'white', 
    padding: '40px 20px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  keyboardHints: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  hint: {
    background: 'rgba(255,255,255,0.2)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    backdropFilter: 'blur(10px)',
  },
  container: { 
    maxWidth: '1400px', 
    margin: '0 auto', 
    padding: '30px 20px',
  },
  title: { 
    fontSize: '2.5rem', 
    fontWeight: '700', 
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  subtitle: { 
    fontSize: '1.1rem', 
    opacity: 0.95,
    fontWeight: '400',
  },
  toast: { 
    position: 'fixed', 
    top: '30px', 
    right: '30px', 
    padding: '16px 24px', 
    borderRadius: '12px', 
    fontSize: '0.95rem', 
    fontWeight: '600', 
    zIndex: 1000,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    animation: 'slideIn 0.3s ease-out',
  },
  toastSuccess: { 
    background: 'white', 
    color: '#2e7d32', 
    border: '2px solid #4caf50',
  },
  toastError: { 
    background: 'white', 
    color: '#c62828', 
    border: '2px solid #f44336',
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '20px', 
    marginBottom: '30px',
  },
  statCard: { 
    background: 'white', 
    padding: '28px 24px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
    textAlign: 'center',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  statCardPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  statCardDanger: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
  },
  statCardSuccess: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
  },
  statCardInfo: {
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: 'white',
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  statValue: { 
    fontSize: '2.5rem', 
    fontWeight: '700', 
    marginBottom: '8px',
  },
  statLabel: { 
    fontSize: '0.9rem', 
    fontWeight: '600', 
    opacity: 0.9,
  },
  searchBar: {
    background: 'white',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: '1 1 300px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '1.2rem',
    pointerEvents: 'none',
  },
  searchInput: {
    flex: 1,
    padding: '14px 44px 14px 48px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    background: '#e0e0e0',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsCompact: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  cityFilter: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'white',
    fontWeight: '500',
    minWidth: '180px',
  },
  exportBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterBar: { 
    display: 'flex', 
    gap: '10px', 
    flexWrap: 'wrap',
  },
  viewControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortSelect: {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'white',
    fontWeight: '500',
  },
  sortOrderBtn: {
    padding: '10px 16px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: '700',
    minWidth: '44px',
  },
  viewModeToggle: {
    display: 'flex',
    gap: '0',
    background: 'white',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    overflow: 'hidden',
  },
  viewModeBtn: {
    padding: '10px 16px',
    background: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '600',
    borderRight: '1px solid #e0e0e0',
  },
  viewModeBtnActive: {
    background: '#667eea',
    color: 'white',
  },
  primaryBtn: { 
    padding: '12px 24px', 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '0.95rem',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  secondaryBtn: { 
    padding: '12px 24px', 
    background: 'white', 
    color: '#667eea', 
    border: '2px solid #667eea', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '0.95rem',
  },
  cancelBtn: { 
    padding: '12px 20px', 
    background: '#e9ecef', 
    color: '#495057', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  form: { 
    background: 'white', 
    padding: '30px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
    marginBottom: '24px',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#333',
  },
  formGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
    gap: '16px', 
    marginBottom: '16px',
  },
  input: { 
    padding: '12px 16px', 
    border: '2px solid #e0e0e0', 
    borderRadius: '10px', 
    fontSize: '0.95rem', 
    fontFamily: 'inherit', 
    width: '100%',
    transition: 'all 0.2s',
  },
  textarea: { 
    padding: '12px 16px', 
    border: '2px solid #e0e0e0', 
    borderRadius: '10px', 
    fontSize: '0.95rem', 
    fontFamily: 'inherit', 
    width: '100%', 
    marginBottom: '20px',
    transition: 'all 0.2s',
    resize: 'vertical',
  },
  fileInput: { 
    marginBottom: '16px', 
    fontSize: '0.95rem',
    padding: '10px',
  },
  fileName: { 
    marginBottom: '16px', 
    fontSize: '0.95rem', 
    color: '#666',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  formActions: { 
    display: 'flex', 
    gap: '12px', 
    flexWrap: 'wrap',
  },
  filterBtn: { 
    padding: '12px 20px', 
    background: 'white', 
    border: '2px solid #e0e0e0', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  filterBtnActive: { 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    color: 'white', 
    borderColor: 'transparent',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  resultsInfo: {
    background: '#e3f2fd',
    padding: '12px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1976d2',
    border: '1px solid #90caf9',
  },
  emptyState: { 
    background: 'white', 
    padding: '80px 40px', 
    borderRadius: '16px', 
    textAlign: 'center', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#333',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '24px',
  },
  gridView: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  prospectCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
  },
  priorityBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  cardBody: {
    padding: '20px',
    flex: 1,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '10px',
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  cardNotes: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  notesText: {
    fontSize: '0.85rem',
    color: '#666',
    marginTop: '8px',
    lineHeight: '1.5',
  },
  cardFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fafafa',
  },
  cardStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  tableWrapper: { 
    background: 'white', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
    overflowX: 'auto',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse',
  },
  tableHeader: { 
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
    borderBottom: '2px solid #dee2e6',
  },
  tableRow: { 
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s',
  },
  badge: { 
    display: 'inline-block', 
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
    color: 'white', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '0.75rem', 
    fontWeight: '700', 
    marginTop: '6px',
  },
  badgeSecondary: { 
    display: 'inline-block', 
    background: '#fff3e0', 
    color: '#e65100', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '0.8rem', 
    fontWeight: '600',
  },
  badgeDanger: {
    display: 'inline-block',
    background: '#ffebee',
    color: '#c62828',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  badgeSuccess: { 
    display: 'inline-block', 
    background: '#e8f5e9', 
    color: '#2e7d32', 
    padding: '6px 12px', 
    borderRadius: '8px', 
    fontSize: '0.85rem', 
    fontWeight: '600',
  },
  badgeInfo: { 
    display: 'inline-block', 
    background: '#e3f2fd', 
    color: '#1976d2', 
    padding: '6px 12px', 
    borderRadius: '8px', 
    fontSize: '0.85rem', 
    fontWeight: '600',
  },
  link: { 
    color: '#667eea', 
    textDecoration: 'none', 
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  actionBtnContact: { 
    padding: '8px 12px', 
    background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '0.85rem', 
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
  },
  actionBtnDelete: { 
    padding: '8px 12px', 
    background: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '0.85rem', 
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
  },
};
