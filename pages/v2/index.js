import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  LayoutDashboard, Users, Target, CheckCircle, Search, X, BarChart3,
  MapPin, Globe, Phone, Star, Zap, Check, Trash2, Clock, Mail,
  Download, ArrowUpRight, TrendingUp, Filter
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import ProspectDossier from '@/components/ProspectDossier';
import EmailGenerator from '@/components/EmailGenerator';
import CallModal from '@/components/CallModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function V2Dashboard() {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('nouveau');
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [dossierProspect, setDossierProspect] = useState(null);
  const [emailProspect, setEmailProspect] = useState(null);
  const [callProspect, setCallProspect] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetch('/api/v2/cities').then(r => r.json())
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadData(1), 350);
    return () => clearTimeout(t);
  }, [searchQuery, filter, selectedCity]);

  const loadData = async (p = 1) => {
    try {
      setLoading(true);
      const offset = (p - 1) * ITEMS_PER_PAGE;
      let url = `/api/v2/prospects?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filter === 'livraison') url += '&delivery=true';
      else if (filter) url += `&status=${filter}`;
      if (selectedCity && selectedCity !== 'All') url += `&city=${encodeURIComponent(selectedCity)}`;

      const [pRes, sRes] = await Promise.all([fetch(url), fetch('/api/v2/stats')]);
      const pData = await pRes.json().catch(() => []);
      const sData = await sRes.json().catch(() => ({}));
      setProspects(Array.isArray(pData) ? pData : []);
      setStats(sData);
      setPage(p);
    } catch { showMsg('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, type = 'success') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleMarkContacted = async (id) => {
    try {
      await fetch('/api/v2/prospects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, contacted: true, status: 'contacted' }) });
      showMsg('Marqué comme contacté ✓');
      loadData(page);
    } catch { showMsg('Erreur', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce prospect ?')) return;
    try {
      await fetch('/api/v2/prospects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      showMsg('Supprimé');
      loadData(page);
    } catch { showMsg('Erreur', 'error'); }
  };

  const handleExportCSV = () => {
    if (!prospects.length) return;
    const h = ['Nom','Téléphone','Email','Site Web','Ville','Catégorie','Note','Avis','Statut'];
    const rows = prospects.map(p => [
      `"${(p.name||'').replace(/"/g,'""')}"`, p.phone||'', p.email||'',
      p.website||'', p.city||'', `"${(p.category||'').replace(/"/g,'""')}"`,
      p.rating, p.reviews, p.status
    ]);
    const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prospecthub_v2_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Charts
  const doughnutData = {
    labels: ['Sans site (Opportunités)', 'Avec site'],
    datasets: [{
      data: [stats.prospectContacter || 0, stats.avecSiteWeb || 0],
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)'],
      borderColor: ['rgba(239,68,68,1)', 'rgba(16,185,129,1)'],
      borderWidth: 2, borderRadius: 4,
    }],
  };
  const barData = {
    labels: (stats.topCities || []).map(c => c.city),
    datasets: [{
      label: 'Prospects',
      data: (stats.topCities || []).map(c => c.count),
      backgroundColor: 'rgba(99,102,241,0.5)',
      borderColor: 'rgb(99,102,241)', borderWidth: 1, borderRadius: 6,
    }],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  const opportunityPct = stats.total > 0 ? Math.round(((stats.prospectContacter || 0) / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#080a0f] to-black text-slate-100 font-sans">
      <Head>
        <title>ProspectHub V2 — Dashboard Enrichi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-black tracking-tight text-white">ProspectHub <span className="text-indigo-400 text-xs font-bold ml-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">V2</span></span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <a href="/v2/crm" className="text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5">CRM Pipeline</a>
            <a href="/reports" className="text-indigo-400 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">Rapports</a>
            <div className="h-4 w-px bg-white/10" />
            <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5">V1 Legacy</a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Toast */}
        {message && (
          <div className={`fixed top-16 right-4 z-50 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-2xl backdrop-blur-md animate-in slide-in-from-right fade-in duration-300 ${messageType === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
            {message}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI label="Total Prospects V2" value={stats.total || 0} icon={Users} accent="indigo" />
          <KPI label="Opportunités (pas de site)" value={`${stats.prospectContacter || 0}`} sub={`${opportunityPct}% du total`} icon={Target} accent="red" />
          <KPI label="Avec Site Web" value={stats.avecSiteWeb || 0} icon={Globe} accent="emerald" />
          <KPI label="Déjà Contactés" value={stats.contactes || 0} icon={CheckCircle} accent="violet" />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Présence Digitale</h3>
            <div className="h-52">{stats.total > 0 ? <Doughnut data={doughnutData} options={{...chartOpts, cutout: '65%'}} /> : <p className="text-slate-600 text-sm text-center pt-16">Aucune donnée</p>}</div>
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Répartition par Ville</h3>
            <div className="h-52">{(stats.topCities||[]).length > 0 ? <Bar data={barData} options={chartOpts} /> : <p className="text-slate-600 text-sm text-center pt-16">Aucune donnée</p>}</div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
            <Pill active={filter === 'nouveau'} onClick={() => setFilter('nouveau')} label="Nouveaux" />
            <Pill active={filter === 'contacter'} onClick={() => setFilter('contacter')} label="Hot Leads 🔥" />
            <Pill active={filter === 'livraison'} onClick={() => setFilter('livraison')} label="Uber Eats 🛵" />
            <Pill active={filter === 'contactes'} onClick={() => setFilter('contactes')} label="Contactés ✓" />
          </div>
          <div className="flex items-center gap-2">
            {cities.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-1.5">
                <Filter className="h-3 w-3 text-indigo-400" />
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="bg-transparent border-none text-xs font-bold text-white focus:outline-none appearance-none cursor-pointer pr-4">
                  <option value="" className="bg-slate-900">Toutes les villes</option>
                  {cities.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Rechercher un restaurant..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-56 rounded-xl border border-white/5 bg-white/[0.03] pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/30" />
            </div>
            <button onClick={handleExportCSV} className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <span className="text-xs font-bold text-slate-500 animate-pulse uppercase tracking-wider">Chargement...</span>
            </div>
          </div>
        ) : prospects.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <div className="text-center space-y-2">
              <Users className="h-10 w-10 text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-500">Aucun prospect trouvé</p>
              <p className="text-xs text-slate-600">Essayez de changer vos filtres ou votre recherche.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/[0.015] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Restaurant</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Contact</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Digital</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Réputation</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {prospects.map(p => (
                  <tr key={p.id} className="group hover:bg-indigo-500/[0.03] transition-colors">
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <button onClick={() => setDossierProspect(p)} className="text-left group/name">
                        <div className="font-bold text-white text-sm flex items-center gap-2 group-hover/name:text-indigo-300 transition-colors">
                          {p.name}
                          {p.is_prospect_to_contact && !p.contacted && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-500/10 text-red-400 rounded-md border border-red-500/20">HOT</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{p.category} · {p.city}</div>
                      </button>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      {p.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                          <Phone className="h-3 w-3 text-emerald-500" />
                          {p.phone}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Pas de tél.</span>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Mail className="h-3 w-3 text-indigo-400" />
                          <span className="truncate max-w-[140px]">{p.email}</span>
                        </div>
                      )}
                      {p.google_maps_url && (
                        <a href={p.google_maps_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mt-1">
                          <MapPin className="h-2.5 w-2.5" /> Maps <ArrowUpRight className="h-2 w-2" />
                        </a>
                      )}
                    </td>
                    {/* Digital */}
                    <td className="px-5 py-3.5">
                      {p.has_website ? (
                        <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 transition-colors">
                          <Globe className="h-3 w-3" /> Site actif
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/15">
                          <X className="h-3 w-3" /> Pas de site
                        </span>
                      )}
                      {p.has_delivery_app && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-400 border border-orange-500/15">
                          🛵 Uber Eats
                        </div>
                      )}
                    </td>
                    {/* Rating */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-white text-sm">{p.rating || '—'}</span>
                        <span className="text-[10px] text-slate-500">({p.reviews || 0})</span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDossierProspect(p)} className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition-all" title="Dossier commercial">
                          <Zap className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEmailProspect(p)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-all" title="Email">
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        {p.phone && (
                          <button onClick={() => setCallProspect(p)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-all" title="Appeler">
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!p.contacted && (
                          <button onClick={() => handleMarkContacted(p.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition-all" title="Marquer contacté">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all" title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && prospects.length > 0 && (
          <div className="mt-4 flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500">
              Page <span className="text-white font-bold">{page}</span> · {prospects.length} affichés sur <span className="text-white font-bold">{stats.total || 0}</span>
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => page > 1 && loadData(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all">← Précédent</button>
              <button onClick={() => loadData(page + 1)} disabled={prospects.length < ITEMS_PER_PAGE} className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-bold text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all">Suivant →</button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {dossierProspect && <ProspectDossier prospect={dossierProspect} onClose={() => setDossierProspect(null)} onActionClick={(t, p) => { setDossierProspect(null); if (t === 'email') setEmailProspect(p); if (t === 'call') setCallProspect(p); }} />}
      {emailProspect && <EmailGenerator prospect={emailProspect} onClose={() => setEmailProspect(null)} />}
      {callProspect && <CallModal prospect={callProspect} onClose={() => setCallProspect(null)} onUpdateStatus={(id) => { handleMarkContacted(id); setCallProspect(null); }} />}
    </div>
  );
}

/* ── Sub-components ── */
function KPI({ label, value, sub, icon: Icon, accent }) {
  const colors = {
    indigo:  'from-indigo-500/10 to-indigo-500/5 border-indigo-500/10 text-indigo-400',
    red:     'from-red-500/10 to-red-500/5 border-red-500/10 text-red-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10 text-emerald-400',
    violet:  'from-violet-500/10 to-violet-500/5 border-violet-500/10 text-violet-400',
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br p-5 overflow-hidden ${colors[accent]}`}>
      <div className="absolute -top-4 -right-4 opacity-[0.07]"><Icon className="h-24 w-24" /></div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{sub}</p>}
    </div>
  );
}

function Pill({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      {label}
    </button>
  );
}
