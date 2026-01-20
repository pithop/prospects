import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ProspectList from '@/components/ProspectList';
import { LayoutDashboard, Users, Target, CheckCircle, Search, Filter, Plus, Upload, X } from 'lucide-react';

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

  const [newProspect, setNewProspect] = useState({
    name: '', phone: '', website: '', city: '', category: '', rating: 0, reviews: 0, notes: ''
  });

  const [importData, setImportData] = useState({ items: [], fileName: '', city: '' });

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Debounce search to avoid too many requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filter]);

  const loadData = async (p = 1) => {
    try {
      setLoading(true);
      const offset = (p - 1) * ITEMS_PER_PAGE;

      let url = `/api/prospects?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      // Note: Filter is currently client-side only for 'status', we could move it server-side too but let's keep it simple for now or fetch all and filter?
      // Actually, if we paginate, client-side filter is broken. We moved search server-side.
      // Let's assume filter is visual for now or we need to add filter param to API too? 
      // For now, let's just make search work.

      const [prospectsRes, statsRes] = await Promise.all([
        fetch(url),
        fetch('/api/stats')
      ]);

      const prospectsData = await prospectsRes.json().catch(() => []);
      const statsData = await statsRes.json().catch(() => ({}));

      // Data is already sorted by API (Hot Leads first)
      setProspects(Array.isArray(prospectsData) ? prospectsData : []);
      setStats(statsData);
      setPage(p);
    } catch (error) {
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    loadData(newPage);
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAddProspect = async (e) => {
    e.preventDefault();
    if (!newProspect.name.trim()) return showMessage('Name is required', 'error');

    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect)
      });

      if (res.ok) {
        showMessage('Prospect added successfully');
        setNewProspect({ name: '', phone: '', website: '', city: '', category: '', rating: 0, reviews: 0, notes: '' });
        setShowAddForm(false);
        loadData();
      } else {
        const err = await res.json();
        showMessage(err.error || 'Error adding prospect', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        let items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || []);
        if (!items.length) return showMessage('Invalid or empty JSON', 'error');
        setImportData({ items, fileName: file.name, city: '' });
      } catch (err) {
        showMessage('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.items.length) return;
    setImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importData.items, city: importData.city || null })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(`Imported ${data.inserted || 0} prospects successfully`);
        setImportData({ items: [], fileName: '', city: '' });
        setShowImportForm(false);
        loadData();
      } else {
        showMessage(data?.error || 'Import failed', 'error');
      }
    } catch (err) {
      showMessage('Network Error', 'error');
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
      showMessage('Marked as contacted');
      loadData();
    } catch (error) { showMessage('Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this prospect?')) return;
    try {
      await fetch('/api/prospects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      showMessage('Prospect deleted');
      loadData();
    } catch (error) { showMessage('Error', 'error'); }
  };

  const filteredProspects = prospects.filter(p => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      );
    }
    if (filter === 'contacter') return p.is_prospect_to_contact && !p.contacted;
    if (filter === 'siteweb') return p.has_website;
    if (filter === 'contactes') return p.contacted;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30">
      <Head>
        <title>ProspectHub | AI Lead Gen</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-slate-800 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">ProspectHub</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/crm" className="text-sm font-medium text-slate-400 hover:text-white hover:text-primary transition-colors">CRM Pipeline</a>
              <div className="text-xs text-slate-500 font-mono">v2.0.0 (AI Edition)</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Toast */}
        {message && (
          <div className={`fixed top-20 right-5 z-50 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-md transition-all ${messageType === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-200' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
            }`}>
            {message}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="Total Prospects" value={stats.total || 0} icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
          <StatCard title="Leads Chauds" value={stats.prospectContacter || 0} icon={Target} color="text-red-400" bg="bg-red-400/10" />
          <StatCard title="Avec Site Web" value={stats.avecSiteWeb || 0} icon={LayoutDashboard} color="text-emerald-400" bg="bg-emerald-400/10" />
          <StatCard title="Contactés" value={stats.contactes || 0} icon={CheckCircle} color="text-indigo-400" bg="bg-indigo-400/10" />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
            <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Tous" count={prospects.length} />
            <FilterBtn active={filter === 'contacter'} onClick={() => setFilter('contacter')} label="À Contacter" count={prospects.filter(p => p.is_prospect_to_contact && !p.contacted).length} />
            <FilterBtn active={filter === 'contactes'} onClick={() => setFilter('contactes')} label="Contactés" count={prospects.filter(p => p.contacted).length} />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-4 text-sm text-white placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={() => { setShowAddForm(true); setShowImportForm(false); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" /> Nouveau
            </button>
            <button
              onClick={() => { setShowImportForm(true); setShowAddForm(false); }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all"
            >
              <Upload className="h-4 w-4" /> Importer
            </button>
          </div>
        </div>

        {/* Forms Modal Area */}
        {showAddForm && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/80 p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Prospect</h3>
              <button onClick={() => setShowAddForm(false)}><X className="h-5 w-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleAddProspect} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input placeholder="Name *" value={newProspect.name} onChange={e => setNewProspect({ ...newProspect, name: e.target.value })} required />
                <Input placeholder="Phone" value={newProspect.phone} onChange={e => setNewProspect({ ...newProspect, phone: e.target.value })} />
                <Input placeholder="Website" value={newProspect.website} onChange={e => setNewProspect({ ...newProspect, website: e.target.value })} />
                <Input placeholder="City" value={newProspect.city} onChange={e => setNewProspect({ ...newProspect, city: e.target.value })} />
                <Input placeholder="Category" value={newProspect.category} onChange={e => setNewProspect({ ...newProspect, category: e.target.value })} />
                <Input type="number" placeholder="Rating (0-5)" step="0.1" value={newProspect.rating} onChange={e => setNewProspect({ ...newProspect, rating: parseFloat(e.target.value) })} />
              </div>
              <textarea
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                rows={3}
                placeholder="Notes..."
                value={newProspect.notes}
                onChange={e => setNewProspect({ ...newProspect, notes: e.target.value })}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-blue-600">Save Prospect</button>
              </div>
            </form>
          </div>
        )}

        {/* Import Form */}
        {showImportForm && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/80 p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-semibold text-white mb-4">Import Scraped Data (JSON)</h3>
            <div className="flex flex-col gap-4">
              <input type="file" accept=".json" onChange={handleFileChange} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600" />
              {importData.fileName && <div className="text-sm text-emerald-400">Selected: {importData.fileName} ({importData.items.length} records)</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowImportForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button onClick={handleImport} disabled={importing || !importData.items.length} className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400 animate-pulse">
            Loading prospects...
          </div>
        ) : (
          <ProspectList
            prospects={filteredProspects}
            onMarkContacted={handleMarkContacted}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination Controls (Server-Side) */}
        {!loading && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-700/50 pt-4">
            <div className="text-sm text-slate-400">
              Showing <span className="font-medium text-white">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-white">{Math.min(page * ITEMS_PER_PAGE, stats.total || 0)}</span> of <span className="font-medium text-white">{stats.total || 0}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil((stats.total || 0) / ITEMS_PER_PAGE)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-lg ${bg} p-3`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function FilterBtn({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${active
        ? 'bg-slate-700 text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-slate-900 text-white' : 'bg-slate-900/50 text-slate-500'}`}>
        {count}
      </span>
    </button>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-500"
    />
  )
}
