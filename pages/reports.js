import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { 
  BarChart3, LayoutDashboard, Target, Users, Globe, Phone, FileText, 
  TrendingUp, Award, DollarSign, Download, Printer, ChevronRight, 
  MapPin, CheckCircle, AlertCircle, Sparkles, Filter, Star
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Reports() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [onlyMissingWebsite, setOnlyMissingWebsite] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(25); // Average ticket price in €
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load all prospects at once (limited to 3000 since it is lightweight analytics)
    fetch('/api/v2/prospects?limit=3000')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProspects(list);
        
        // Extract distinct cities & categories
        const uniqCities = ['All', ...new Set(list.map(p => p.city).filter(Boolean))];
        const uniqCategories = ['All', ...new Set(list.map(p => p.category?.split(' ')[0]).filter(Boolean))];
        setCities(uniqCities);
        setCategories(uniqCategories);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load prospects for reports', err);
        setLoading(false);
      });
  }, []);

  // Filtered prospects based on visual interactive selections
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (selectedCity !== 'All' && p.city !== selectedCity) return false;
      if (selectedCategory !== 'All' && !p.category?.startsWith(selectedCategory)) return false;
      if (p.rating < minRating) return false;
      if (onlyMissingWebsite && p.has_website) return false;
      return true;
    });
  }, [prospects, selectedCity, selectedCategory, minRating, onlyMissingWebsite]);

  // Statistics calculation for the current selection
  const reportStats = useMemo(() => {
    const total = filteredProspects.length;
    const missingWebsite = filteredProspects.filter(p => !p.has_website).length;
    const hasPhone = filteredProspects.filter(p => p.phone && p.phone.length > 0).length;
    const contacted = filteredProspects.filter(p => p.contacted).length;
    
    // Average rating
    const ratedProspects = filteredProspects.filter(p => p.rating > 0);
    const avgRating = ratedProspects.length > 0
      ? (ratedProspects.reduce((sum, p) => sum + p.rating, 0) / ratedProspects.length).toFixed(1)
      : 0;

    // Opportunity Score (e.g. how many low-hanging fruits)
    const lowHangingFruits = filteredProspects.filter(p => !p.has_website && p.rating >= 4.0).length;

    // Financial calculations
    const avgMissedCustomersPerRestaurant = 120; // assumed monthly missed visitors
    const totalMonthlyLoss = missingWebsite * avgMissedCustomersPerRestaurant * ticketPrice;
    const totalYearlyLoss = totalMonthlyLoss * 12;

    return {
      total,
      missingWebsite,
      hasPhone,
      contacted,
      avgRating,
      lowHangingFruits,
      totalMonthlyLoss,
      totalYearlyLoss
    };
  }, [filteredProspects, ticketPrice]);

  // Chart data 1: Website vs No Website
  const pieData = {
    labels: ['Sans site internet', 'Site actif'],
    datasets: [
      {
        data: [reportStats.missingWebsite, reportStats.total - reportStats.missingWebsite],
        backgroundColor: ['rgba(239, 68, 68, 0.65)', 'rgba(16, 185, 129, 0.65)'],
        borderColor: ['rgba(239, 68, 68, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1.5,
      },
    ],
  };

  // Chart data 2: Ratings distribution
  const ratingGroups = useMemo(() => {
    const groups = { 'Excellent (4.5+)': 0, 'Très bien (4.0-4.4)': 0, 'Moyen (3.0-3.9)': 0, 'Critique (<3.0)': 0 };
    filteredProspects.forEach(p => {
      if (p.rating >= 4.5) groups['Excellent (4.5+)']++;
      else if (p.rating >= 4.0) groups['Très bien (4.0-4.4)']++;
      else if (p.rating >= 3.0) groups['Moyen (3.0-3.9)']++;
      else if (p.rating > 0) groups['Critique (<3.0)']++;
    });
    return groups;
  }, [filteredProspects]);

  const barData = {
    labels: Object.keys(ratingGroups),
    datasets: [
      {
        label: 'Nombre de restaurants',
        data: Object.values(ratingGroups),
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } },
      title: { display: false }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0c10] to-black text-slate-100 font-sans selection:bg-indigo-500/30 pb-16">
      <Head>
        <title>ProspectHub | Rapports & Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">ProspectHub <span className="text-indigo-400 text-sm font-bold ml-1">Reports Suite</span></span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/v2" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Dashboard V2</a>
              <a href="/v2/crm" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">CRM V2</a>
              <a href="/" className="text-sm text-slate-500 hover:text-white transition-colors">V1 Legacy</a>
              <div className="h-4 w-px bg-white/10"></div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-black text-white transition-all shadow-md shadow-indigo-500/20"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer Rapport
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content wrapper */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:bg-white print:text-black">
        
        {/* Printable header info */}
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-3xl font-black text-black">RAPPORT D'ANALYSE DE MARCHÉ NUMÉRIQUE</h1>
          <p className="text-sm text-gray-500 mt-2">Généré le {new Date().toLocaleDateString('fr-FR')} • Ville ciblée : {selectedCity === 'All' ? 'Toutes les villes' : selectedCity}</p>
          <hr className="mt-4 border-gray-300" />
        </div>

        {/* Dashboard Title & Description */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-wider uppercase mb-1">
              <Sparkles className="h-4 w-4" /> Analyse de Marché & Opportunités
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Rapports Commerciaux</h1>
            <p className="text-slate-400 mt-1">Générez des rapports et repérez les plus gros gisements de croissance commerciale.</p>
          </div>
          
          {/* Financial Simulator Trigger */}
          <div className="flex items-center gap-4 bg-slate-900 border border-white/5 p-3 rounded-2xl">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Panier moyen simulé</span>
                <span className="text-indigo-400 font-black">{ticketPrice} €</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="80" 
                step="5"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-48 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0f1115]/60 backdrop-blur-xl p-6 mb-8 print:hidden">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> Personnaliser le Rapport commercial
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Filtrer par Ville</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-10 rounded-xl bg-slate-900 border border-white/5 text-sm font-semibold text-white px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {cities.map(c => <option key={c} value={c}>{c === 'All' ? 'Toutes les villes' : c}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Secteur / Cuisine</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 rounded-xl bg-slate-900 border border-white/5 text-sm font-semibold text-white px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'Tous les secteurs' : cat}</option>)}
              </select>
            </div>

            {/* Min Rating */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Note Google Minimale</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-10 rounded-xl bg-slate-900 border border-white/5 text-sm font-semibold text-white px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={0}>Toutes les notes</option>
                <option value={3}>Supérieure à 3.0 ★</option>
                <option value={4}>Supérieure à 4.0 ★ (Excellente réputation)</option>
                <option value={4.5}>Supérieure à 4.5 ★ (Leaders locaux)</option>
              </select>
            </div>

            {/* Missing website checkbox */}
            <div className="flex items-center pt-6">
              <label className="relative flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={onlyMissingWebsite}
                  onChange={(e) => setOnlyMissingWebsite(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-300">Opportunités sans Site Web uniquement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Loader */}
        {loading ? (
          <div className="flex h-94 items-center justify-center text-slate-400 animate-pulse font-bold">
            Génération des statistiques en cours...
          </div>
        ) : (
          <div className="space-y-8">

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ReportKPICard title="Établissements ciblés" value={reportStats.total} icon={Users} color="text-indigo-400" bg="bg-indigo-400/10 border-indigo-500/10" />
              <ReportKPICard title="Sans site web (Opportunités)" value={`${reportStats.missingWebsite} (${((reportStats.missingWebsite / Math.max(1, reportStats.total)) * 100).toFixed(0)}%)`} icon={Globe} color="text-red-400" bg="bg-red-400/10 border-red-500/10" />
              <ReportKPICard title="Bons avis sans Site" value={reportStats.lowHangingFruits} icon={Award} color="text-amber-400" bg="bg-amber-400/10 border-amber-500/10" />
              <ReportKPICard title="Chiffre d'Affaires Perdu" value={`${reportStats.totalYearlyLoss.toLocaleString('fr-FR')} € / an`} icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-500/10 animate-pulse" />
            </div>

            {/* Market Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Pie: Website presence */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0f1115]/50 h-80 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taux de présence numérique</h3>
                <div className="h-56 relative">
                  <Pie data={pieData} options={chartOptions} />
                </div>
              </div>

              {/* Bar: Google ratings */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 bg-[#0f1115]/50 h-80 flex flex-col justify-between lg:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Répartition de la réputation (Google Maps)</h3>
                <div className="h-56">
                  <Bar data={barData} options={chartOptions} />
                </div>
              </div>

            </div>

            {/* Executive Synthesis (The commercial speech generator) */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Synthèse Stratégique Globale — {selectedCity === 'All' ? 'Montpellier & Alentours' : selectedCity}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Généré intelligemment par ProspectHub</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-300">
                <div className="space-y-4">
                  <p>
                    L'analyse digitale menée à <strong>{selectedCity === 'All' ? 'Montpellier' : selectedCity}</strong> sur un échantillon ciblé de <strong>{reportStats.total} restaurants</strong> révèle un écart commercial majeur.
                  </p>
                  <p>
                    Pas moins de <strong>{reportStats.missingWebsite} établissements ({((reportStats.missingWebsite / Math.max(1, reportStats.total)) * 100).toFixed(0)}%)</strong> ne disposent d'aucun site internet indépendant. Ces commerces dépendent exclusivement des services de livraison tiers (Uber Eats) et de l'annuaire par défaut de Google.
                  </p>
                  <p className="border-l-2 border-amber-500 pl-4 italic text-amber-200">
                    Cette dépendance coûte en moyenne <strong>30% de commission</strong> sur chaque transaction directe réalisée via Uber Eats, amputant lourdement les marges nettes des artisans restaurateurs.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <p>
                    À l'échelle du marché local analysé, et en simulant un panier d'achat moyen de <strong>{ticketPrice} €</strong> avec une perte prudente de 120 clients potentiels par restaurant et par mois, le <strong>manque à gagner annuel s'élève à {reportStats.totalYearlyLoss.toLocaleString('fr-FR')} €</strong>.
                  </p>
                  <p>
                    Parmi ces opportunités, <strong>{reportStats.lowHangingFruits} établissements</strong> sont qualifiés de "Low-Hanging Fruits". Il s'agit de restaurants extrêmement bien notés sur Google (note &gt;= 4.0 ★) mais privés de canal de commande direct. Ce sont nos cibles prioritaires car la conversion de leurs clients fidèles en canal direct est immédiate.
                  </p>
                  <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="h-4.5 w-4.5" /> Recommandation : Pitcher la "Souveraineté Digitale" et le Click & Collect direct sans commission.
                  </p>
                </div>
              </div>
            </div>

            {/* List of top 10 Quick-Win Leads */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-400" /> Top 10 des Meilleures Opportunités ciblées
              </h3>
              
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0f1115]/60 backdrop-blur-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/50 text-xs uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold border-b border-white/5">Restaurant</th>
                      <th className="px-6 py-4 font-bold border-b border-white/5">Note Google</th>
                      <th className="px-6 py-4 font-bold border-b border-white/5">Téléphone</th>
                      <th className="px-6 py-4 font-bold border-b border-white/5">Manque à gagner mensuel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProspects
                      .filter(p => !p.has_website)
                      .sort((a, b) => b.rating - a.rating)
                      .slice(0, 10)
                      .map((p) => {
                        const monthlyLoss = 120 * ticketPrice;
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-white text-sm">{p.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{p.category} • {p.city}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-white">{p.rating}</span>
                                <span className="text-slate-500 text-xs">({p.reviews} avis)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-medium font-mono text-xs">
                              {p.phone || 'Non renseigné'}
                            </td>
                            <td className="px-6 py-4 text-red-400 font-bold">
                              -{monthlyLoss.toLocaleString('fr-FR')} € / mois
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

function ReportKPICard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className={`rounded-2xl border bg-slate-900/50 p-6 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] ${bg}`}>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-white/5`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
