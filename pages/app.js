import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import KanbanView from '../components/KanbanView';

export default function Home() {
  const router = useRouter();
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table', or 'kanban'
  const [sortBy, setSortBy] = useState('smart'); // 'smart', 'name', 'city', 'rating', 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedCity, setSelectedCity] = useState(''); // For city filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState(null);

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
        body: JSON.stringify({ 
          id, 
          contacted: true, 
          contact_date: new Date().toISOString(), 
          status: 'Contacté'  // Using capitalized status to match Kanban column
        })
      });
      showMessage('Marqué comme contacté ✅');
      loadData(); // Refresh data to reflect changes
    } catch (error) {
      showMessage('Erreur lors de la mise à jour', 'error');
    }
  };

  // Open delete confirmation modal
  const handleDelete = (prospect) => {
    setProspectToDelete(prospect);
    setShowDeleteModal(true);
  };

  // Actual delete after modal confirmation
  const handleConfirmDelete = async () => {
    if (!prospectToDelete) return;
    
    try {
      await fetch('/api/prospects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospectToDelete.id })
      });
      showMessage('Prospect supprimé ✅');
      setShowDeleteModal(false);
      setProspectToDelete(null);
      loadData(); // Refresh data
    } catch (error) {
      showMessage('Erreur lors de la suppression', 'error');
    }
  };

  // Handle status change from Kanban view
  const handleStatusChange = async (prospectId, newStatus) => {
    try {
      // Prepare update data
      const updateData = {
        id: prospectId,
        status: newStatus
      };

      // Bonus: If status is "Contacté", also update contacted and contact_date
      if (newStatus === 'Contacté') {
        updateData.contacted = true;
        updateData.contact_date = new Date().toISOString();
      }

      await fetch('/api/prospects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      showMessage(`Statut mis à jour: ${newStatus} ✅`);
      loadData(); // Refresh data to reflect changes
    } catch (error) {
      showMessage('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      showMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const headers = ['Nom', 'Téléphone', 'Ville', 'Site Web', 'Catégorie', 'Note', 'Statut', 'Contacté'];
    const csvData = paginatedProspects.map(p => [
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
  
  // Intelligent ranking algorithm
  const calculateProspectScore = (prospect) => {
    let score = 0;
    
    // Priority 1: Not contacted and to contact (HIGH VALUE)
    if (prospect.is_prospect_to_contact && !prospect.contacted) {
      score += 100;
    }
    
    // Priority 2: Has high rating (quality indicator)
    if (prospect.rating) {
      score += prospect.rating * 10; // 0-50 points
    }
    
    // Priority 3: Has reviews (engagement indicator)
    if (prospect.reviews) {
      score += Math.min(prospect.reviews, 20); // Cap at 20 points
    }
    
    // Priority 4: No website = easier to approach
    if (!prospect.has_website && !prospect.is_third_party) {
      score += 30;
    }
    
    // Priority 5: Has phone number (contactable)
    if (prospect.phone) {
      score += 20;
    }
    
    // Priority 6: Recently added (fresher data)
    if (prospect.created_at) {
      const daysSinceCreation = (Date.now() - new Date(prospect.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) {
        score += 15;
      } else if (daysSinceCreation < 30) {
        score += 10;
      }
    }
    
    // Penalty: Already contacted
    if (prospect.contacted) {
      score -= 50;
    }
    
    return score;
  };

  // Advanced filtering with search and intelligent ranking
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
        case 'smart':
          // Intelligent ranking
          aVal = calculateProspectScore(a);
          bVal = calculateProspectScore(b);
          break;
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
          aVal = calculateProspectScore(a);
          bVal = calculateProspectScore(b);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [safeProspects, filter, searchQuery, sortBy, sortOrder, selectedCity]);

  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const paginatedProspects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProspects.slice(startIndex, endIndex);
  }, [filteredProspects, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, selectedCity, sortBy]);

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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
          background: #fafafa;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: #1a1a1a;
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #1a1a1a !important;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05) !important;
        }

        button {
          transition: all 0.15s ease;
        }

        button:hover {
          opacity: 0.9;
        }

        button:active {
          transform: scale(0.98);
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
          
          h1 {
            font-size: 1.5rem !important;
          }
          
          h2 {
            font-size: 1.25rem !important;
          }
          
          h3 {
            font-size: 1.1rem !important;
          }
          
          /* Stack buttons vertically on mobile */
          button {
            min-width: 44px !important;
            min-height: 44px !important;
          }
        }

        @media (max-width: 480px) {
          /* Extra small screens */
          .card-hover:hover {
            transform: none;
          }
        }
      `}</style>

      {/* Unified Header - Authenticated state */}
      <Header isAuthenticated={true} />

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
              <option value="smart">🎯 Tri intelligent (recommandé)</option>
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
              <button 
                onClick={() => setViewMode('kanban')}
                style={{ ...styles.viewModeBtn, ...(viewMode === 'kanban' ? styles.viewModeBtnActive : {}) }}
                title="Vue pipeline (Kanban)"
              >
                📊
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
            {paginatedProspects.map((p) => (
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
                    <button onClick={() => handleDelete(p)} style={styles.actionBtnDelete} title="Supprimer">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'table' ? (
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
                {paginatedProspects.map((p) => (
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
                        <button onClick={() => handleDelete(p)} style={styles.actionBtnDelete} title="Supprimer">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban View */
          <KanbanView
            prospects={filteredProspects}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Pagination - Only show for grid and table views */}
        {viewMode !== 'kanban' && filteredProspects.length > itemsPerPage && (
          <div style={styles.paginationContainer}>
            <div style={styles.paginationInfo}>
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredProspects.length)} sur {filteredProspects.length} prospects
            </div>
            
            <div style={styles.paginationControls}>
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                style={{...styles.paginationBtn, ...(currentPage === 1 && styles.paginationBtnDisabled)}}
              >
                ⏮ Première
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                style={{...styles.paginationBtn, ...(currentPage === 1 && styles.paginationBtnDisabled)}}
              >
                ← Précédent
              </button>
              
              <div style={styles.paginationPages}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        ...styles.paginationBtn,
                        ...(currentPage === pageNum && styles.paginationBtnActive)
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{...styles.paginationBtn, ...(currentPage === totalPages && styles.paginationBtnDisabled)}}
              >
                Suivant →
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                style={{...styles.paginationBtn, ...(currentPage === totalPages && styles.paginationBtnDisabled)}}
              >
                Dernière ⏭
              </button>
            </div>

            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={styles.itemsPerPageSelect}
            >
              <option value="12">12 par page</option>
              <option value="24">24 par page</option>
              <option value="48">48 par page</option>
              <option value="100">100 par page</option>
            </select>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProspectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        prospectName={prospectToDelete?.name || ''}
      />
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
    background: '#ffffff',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    color: '#1a1a1a',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  container: { 
    maxWidth: '1400px', 
    margin: '0 auto', 
    padding: '30px 20px',
  },
  toast: { 
    position: 'fixed', 
    top: '20px', 
    right: '20px', 
    padding: '12px 20px', 
    borderRadius: '8px', 
    fontSize: '0.9rem', 
    fontWeight: '500', 
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.3s ease-out',
  },
  toastSuccess: { 
    background: '#ffffff', 
    color: '#1a1a1a', 
    border: '1px solid #e5e5e5',
  },
  toastError: { 
    background: '#ffffff', 
    color: '#dc2626', 
    border: '1px solid #fecaca',
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '16px', 
    marginBottom: '24px',
  },
  statCard: { 
    background: 'white', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    textAlign: 'center',
    border: '1px solid #e5e5e5',
  },
  statCardPrimary: {
    background: '#ffffff',
    borderLeft: '3px solid #1a1a1a',
  },
  statCardDanger: {
    background: '#ffffff',
    borderLeft: '3px solid #dc2626',
  },
  statCardSuccess: {
    background: '#ffffff',
    borderLeft: '3px solid #10b981',
  },
  statCardInfo: {
    background: '#ffffff',
    borderLeft: '3px solid #3b82f6',
  },
  statIcon: {
    fontSize: '1.5rem',
    marginBottom: '8px',
    opacity: 0.7,
  },
  statValue: { 
    fontSize: '2rem', 
    fontWeight: '600', 
    marginBottom: '6px',
    color: '#1a1a1a',
  },
  statLabel: { 
    fontSize: '0.85rem', 
    fontWeight: '500', 
    color: '#666',
  },
  searchBar: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    border: '1px solid #e5e5e5',
  },
  searchInputWrapper: {
    flex: '1 1 300px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '1.1rem',
    pointerEvents: 'none',
    color: '#999',
  },
  searchInput: {
    flex: 1,
    padding: '10px 40px 10px 44px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    background: '#fafafa',
  },
  clearSearch: {
    position: 'absolute',
    right: '10px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  actionButtonsCompact: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cityFilter: {
    padding: '10px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: '#fafafa',
    fontWeight: '500',
    minWidth: '160px',
    color: '#1a1a1a',
  },
  exportBtn: {
    padding: '10px 20px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBar: { 
    display: 'flex', 
    gap: '8px', 
    flexWrap: 'wrap',
  },
  viewControls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortSelect: {
    padding: '8px 14px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'white',
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sortOrderBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '600',
    minWidth: '40px',
    color: '#1a1a1a',
  },
  viewModeToggle: {
    display: 'flex',
    gap: '0',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
  },
  viewModeBtn: {
    padding: '8px 14px',
    background: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    borderRight: '1px solid #e5e5e5',
    color: '#666',
  },
  viewModeBtnActive: {
    background: '#1a1a1a',
    color: 'white',
  },
  primaryBtn: { 
    padding: '10px 20px', 
    background: '#1a1a1a', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '500', 
    fontSize: '0.9rem',
  },
  secondaryBtn: { 
    padding: '10px 20px', 
    background: 'white', 
    color: '#1a1a1a', 
    border: '1px solid #e5e5e5', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '500', 
    fontSize: '0.9rem',
  },
  cancelBtn: { 
    padding: '10px 18px', 
    background: '#f5f5f5', 
    color: '#666', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  form: { 
    background: 'white', 
    padding: '24px', 
    borderRadius: '12px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    marginBottom: '20px',
    border: '1px solid #e5e5e5',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  formGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
    gap: '14px', 
    marginBottom: '14px',
  },
  input: { 
    padding: '10px 14px', 
    border: '1px solid #e5e5e5', 
    borderRadius: '8px', 
    fontSize: '0.9rem', 
    fontFamily: 'inherit', 
    width: '100%',
    transition: 'all 0.2s',
    background: '#fafafa',
  },
  textarea: { 
    padding: '10px 14px', 
    border: '1px solid #e5e5e5', 
    borderRadius: '8px', 
    fontSize: '0.9rem', 
    fontFamily: 'inherit', 
    width: '100%', 
    marginBottom: '16px',
    transition: 'all 0.2s',
    resize: 'vertical',
    background: '#fafafa',
  },
  fileInput: { 
    marginBottom: '14px', 
    fontSize: '0.9rem',
    padding: '8px',
  },
  fileName: { 
    marginBottom: '14px', 
    fontSize: '0.9rem', 
    color: '#666',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '6px',
    border: '1px solid #e5e5e5',
  },
  formActions: { 
    display: 'flex', 
    gap: '10px', 
    flexWrap: 'wrap',
  },
  filterBtn: { 
    padding: '8px 16px', 
    background: 'white', 
    border: '1px solid #e5e5e5', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '500', 
    fontSize: '0.85rem',
    transition: 'all 0.15s',
    color: '#666',
  },
  filterBtnActive: { 
    background: '#1a1a1a', 
    color: 'white', 
    borderColor: '#1a1a1a',
  },
  resultsInfo: {
    background: '#f5f5f5',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#666',
    border: '1px solid #e5e5e5',
  },
  emptyState: { 
    background: 'white', 
    padding: '60px 30px', 
    borderRadius: '12px', 
    textAlign: 'center', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e5e5e5',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '16px',
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '0.95rem',
    color: '#666',
    marginBottom: '20px',
  },
  gridView: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  prospectCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #f0f0f0',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '6px',
  },
  priorityBadge: {
    display: 'inline-block',
    background: '#1a1a1a',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  cardBody: {
    padding: '16px',
    flex: 1,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  cardLabel: {
    fontSize: '0.8rem',
    color: '#999',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: '0.85rem',
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'right',
  },
  cardNotes: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  notesText: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '6px',
    lineHeight: '1.5',
  },
  cardFooter: {
    padding: '12px 16px',
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
    gap: '6px',
  },
  tableWrapper: { 
    background: 'white', 
    borderRadius: '12px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    overflowX: 'auto',
    border: '1px solid #e5e5e5',
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse',
  },
  tableHeader: { 
    background: '#fafafa', 
    borderBottom: '1px solid #e5e5e5',
  },
  tableRow: { 
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.15s',
  },
  badge: { 
    display: 'inline-block', 
    background: '#1a1a1a', 
    color: 'white', 
    padding: '3px 8px', 
    borderRadius: '4px', 
    fontSize: '0.7rem', 
    fontWeight: '600', 
    marginTop: '4px',
  },
  badgeSecondary: { 
    display: 'inline-block', 
    background: '#f5f5f5', 
    color: '#666', 
    padding: '3px 8px', 
    borderRadius: '4px', 
    fontSize: '0.75rem', 
    fontWeight: '500',
    border: '1px solid #e5e5e5',
  },
  badgeDanger: {
    display: 'inline-block',
    background: '#fef2f2',
    color: '#dc2626',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    border: '1px solid #fecaca',
  },
  badgeSuccess: { 
    display: 'inline-block', 
    background: '#f0fdf4', 
    color: '#16a34a', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '0.8rem', 
    fontWeight: '500',
    border: '1px solid #bbf7d0',
  },
  badgeInfo: { 
    display: 'inline-block', 
    background: '#eff6ff', 
    color: '#2563eb', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '0.8rem', 
    fontWeight: '500',
    border: '1px solid #bfdbfe',
  },
  link: { 
    color: '#1a1a1a', 
    textDecoration: 'underline', 
    fontWeight: '500',
    transition: 'opacity 0.15s',
  },
  actionBtnContact: { 
    padding: '6px 10px', 
    background: '#1a1a1a', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '0.8rem', 
    fontWeight: '500',
  },
  actionBtnDelete: { 
    padding: '6px 10px', 
    background: '#dc2626', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '0.8rem', 
    fontWeight: '500',
  },
  paginationContainer: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  paginationPages: {
    display: 'flex',
    gap: '4px',
  },
  paginationBtn: {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#1a1a1a',
    transition: 'all 0.15s',
  },
  paginationBtnActive: {
    background: '#1a1a1a',
    color: 'white',
    borderColor: '#1a1a1a',
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  itemsPerPageSelect: {
    padding: '8px 16px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'white',
    fontWeight: '500',
    color: '#1a1a1a',
  },
};
