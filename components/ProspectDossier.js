import React, { useState, useMemo } from 'react';
import { 
  X, Zap, FileText, Phone, Mail, Globe, Star, MapPin, 
  TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, 
  Printer, DollarSign, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';

export default function ProspectDossier({ prospect, onClose, onActionClick }) {
  const [activeTab, setActiveTab] = useState('audit'); // audit, pitch, calculator
  const [ticketPrice, setTicketPrice] = useState(25); // Default €25 average ticket
  const [missedCustomers, setMissedCustomers] = useState(150); // Default 150 missed per month
  const [activeObjection, setActiveObjection] = useState(null);

  // 1. Calculate Score
  const score = useMemo(() => {
    let base = 100;
    if (!prospect.has_website) base -= 35;
    if (prospect.rating < 4.0) base -= 25;
    if (prospect.reviews < 50) base -= 15;
    if (prospect.has_delivery_app) base -= 10; // Commission drain
    return Math.max(10, base);
  }, [prospect]);

  // 2. ROI calculations
  const monthlyLoss = missedCustomers * ticketPrice;
  const yearlyLoss = monthlyLoss * 12;
  const recoveryPotential = yearlyLoss * 0.4; // 40% recovery target

  // Objections list
  const objections = [
    {
      id: 'price',
      title: "💰 C'est trop cher",
      script: "Je comprends. Cependant, perdre ne serait-ce que 5 clients par semaine à cause d'une mauvaise image en ligne vous coûte déjà 500 € par mois. Notre solution se rentabilise dès le premier mois."
    },
    {
      id: 'no_interest',
      title: "✋ Pas intéressé / Je n'ai pas le temps",
      script: "Je respecte totalement votre temps. En réalité, 86% des clients à Montpellier choisissent leur restaurant sur Google Maps avant de commander. C'est pour cela que je voulais simplement vous montrer le trou dans votre raquette numérique."
    },
    {
      id: 'third_party',
      title: "🛵 J'utilise déjà Uber Eats / Deliveroo",
      script: "C'est une excellente chose pour démarrer ! Mais saviez-vous qu'avec 30% de commission sur chaque commande, vous offrez presque toute votre marge aux plateformes ? Nous mettons en place votre propre canal sans commission."
    },
    {
      id: 'existing',
      title: "🤝 J'ai déjà un prestataire / agence",
      script: "C'est parfait ! Est-ce qu'ils s'occupent également d'optimiser vos fiches locales pour capter le trafic de vos concurrents directs à Montpellier, ou est-ce qu'ils font juste de la maintenance technique ?"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:h-[90vh]">
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-white/5 bg-gradient-to-r from-slate-950/80 via-slate-900 to-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{prospect.name || prospect.restaurant_name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${score > 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    score > 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                    'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                  Santé Digitale: {score}/100
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{prospect.category || 'Restaurant'} • {prospect.city || 'Montpellier'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Imprimer le dossier"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex-none bg-slate-950/40 border-b border-white/5 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} label="Audit Local & Roast" icon={Zap} />
          <TabButton active={activeTab === 'pitch'} onClick={() => setActiveTab('pitch')} label="Stratégie de Vente" icon={ShieldCheck} />
          <TabButton active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} label="Calculateur ROI" icon={TrendingUp} />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-900/60 print:bg-white print:text-black">
          
          {/* TAB 1: AUDIT LOCAL & ROAST */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Score card & Visual Audit */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Health score showcase */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Diagnostic Vital</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-5xl font-black text-white">{score}%</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Score digital</span>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <h5 className="font-bold text-white text-base">Analyse des points critiques :</h5>
                      <ul className="space-y-2">
                        <AuditItem checked={prospect.has_website} text="Site internet indépendant propre" />
                        <AuditItem checked={prospect.rating >= 4.0} text={`Note Google excellente (${prospect.rating || 0}/5)`} />
                        <AuditItem checked={prospect.reviews >= 80} text={`Volume d'avis solide (${prospect.reviews_count || prospect.reviews || 0} avis)`} />
                        <AuditItem checked={!prospect.has_delivery_app} text="Indépendance des plateformes (Uber Eats / Deliveroo)" />
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Local Custom Roast */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Analyse du Manque à Gagner
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {!prospect.has_website ? (
                      `L'établissement "${prospect.name || prospect.restaurant_name}" est totalement invisible en dehors des plateformes tierces comme Uber Eats. En n'ayant pas de site web propre pour proposer du Click & Collect en direct, ce commerce perd en moyenne 30% de commission sur chaque transaction et laisse Google Maps rediriger les clients chauds de Montpellier vers des chaînes concurrentes.`
                    ) : (
                      `Bien que ${prospect.name || prospect.restaurant_name} possède un site internet, sa fiche locale et son optimisation locale sur Montpellier comportent des lacunes. Il n'y a pas d'intégration forte pour convertir directement les internautes locaux en réservations ou commandes directes.`
                    )}
                  </p>
                </div>

                {/* Specific Action points */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Plan d'action prioritaire</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionStep 
                      num="01" 
                      title="Créer un Site Vente Directe" 
                      desc="Mettre en place un menu digital avec Click & Collect direct sans commission pour court-circuiter Uber Eats." 
                    />
                    <ActionStep 
                      num="02" 
                      title="Optimisation Google Maps" 
                      desc="Activer les mots-clés locaux de Montpellier et automatiser la collecte d'avis 5 étoiles auprès des clients." 
                    />
                  </div>
                </div>

              </div>

              {/* Sidebar stats & quick details */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-950 p-6 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informations Fiche</h4>
                  
                  <div className="space-y-3">
                    <DetailPill label="Nom officiel" value={prospect.name || prospect.restaurant_name} />
                    <DetailPill label="Téléphone" value={prospect.phone || prospect.phone_number || 'Non renseigné'} />
                    <DetailPill label="Adresse" value={prospect.address || 'Montpellier'} />
                    <DetailPill label="Site Web" value={prospect.website || prospect.website_url_found || 'Aucun'} />
                    <DetailPill label="Catégorie" value={prospect.category || 'Non spécifiée'} />
                    <DetailPill label="Horaire de contact" value={prospect.best_time_to_call || '10:00 - 11:30'} />
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                    {prospect.google_maps_url && (
                      <a 
                        href={prospect.google_maps_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl border border-white/10 transition-all"
                      >
                        <MapPin className="h-3.5 w-3.5" /> Voir sur Google Maps ↗
                      </a>
                    )}
                    {(prospect.uber_eats_url || prospect.url) && (
                      <a 
                        href={prospect.uber_eats_url || prospect.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl border border-white/10 transition-all"
                      >
                        <Globe className="h-3.5 w-3.5" /> Voir sur Uber Eats ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STRATÉGIE DE VENTE */}
          {activeTab === 'pitch' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Cold Calling script */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl bg-slate-950 p-6 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Icebreaker & Pitch Téléphonique</h4>
                  
                  <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-400">Le Brise-Glace (10 premières secondes)</span>
                    <p className="text-sm text-slate-100 italic">
                      "Bonjour ! C'est bien le responsable de {prospect.name || prospect.restaurant_name} ? C'est Idriss de ProspectHub à Montpellier. Je vous appelle car j'adore votre menu sur Uber Eats, mais j'ai constaté un bug en essayant de commander directement sur votre propre site pour économiser vos frais... vous saviez que vos clients partent directement chez le concurrent ?"
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">L'Angle d'attaque Principal</span>
                    <p className="text-sm text-slate-200">
                      {prospect.has_delivery_app ? (
                        "Insister lourdement sur la commission de 30% d'Uber Eats. Expliquer qu'un client qui commande 4 fois par mois chez eux génère plus de perte de marge que le prix d'un site web indépendant complet en Click & Collect direct."
                      ) : (
                        "Miser sur la souveraineté numérique. Ne pas être présent de manière indépendante à Montpellier, c'est laisser 100% du monopole des nouveaux arrivants et des réservations à vos concurrents qui ont un site soigné."
                      )}
                    </p>
                  </div>
                </div>

                {/* Interactive objections */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-indigo-400" /> Traitement Interactif des Objections
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {objections.map((obj) => (
                      <button
                        key={obj.id}
                        onClick={() => setActiveObjection(activeObjection === obj.id ? null : obj.id)}
                        className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-2
                          ${activeObjection === obj.id ? 
                            'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5' : 
                            'bg-slate-950 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-900'}`}
                      >
                        <div className="flex justify-between items-center w-full font-bold text-sm">
                          <span>{obj.title}</span>
                          <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${activeObjection === obj.id ? 'rotate-90 text-indigo-400' : ''}`} />
                        </div>
                        {activeObjection === obj.id && (
                          <p className="text-xs text-indigo-200 leading-relaxed border-t border-indigo-500/20 pt-2 animate-in fade-in duration-200">
                            {obj.script}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons right box */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/20 p-6 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Passer à l'action</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Utilisez nos modèles intégrés pour appeler ou envoyer un email ultra-ciblé d'audit en un clic.
                  </p>
                  
                  <div className="space-y-3">
                    {prospect.phone && (
                      <button 
                        onClick={() => onActionClick('call', prospect)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <Phone className="h-4 w-4" /> Lancer l'Appel direct
                      </button>
                    )}
                    <button 
                      onClick={() => onActionClick('email', prospect)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <Mail className="h-4 w-4" /> Générer Email de Vente
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CALCULATEUR ROI */}
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Sliders and Configuration */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl bg-slate-950 p-6 border border-white/5 space-y-6">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Simulateur de Manque à Gagner Financier</h4>
                  
                  {/* Slider 1: Average Ticket */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Panier moyen par client</span>
                      <span className="text-indigo-400">{ticketPrice} €</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>10 €</span>
                      <span>50 €</span>
                      <span>100 €</span>
                    </div>
                  </div>

                  {/* Slider 2: Missed Customers */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-white">
                      <span>Clients manqués (par mois)</span>
                      <span className="text-indigo-400">{missedCustomers}</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="1000" 
                      step="10"
                      value={missedCustomers}
                      onChange={(e) => setMissedCustomers(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>20</span>
                      <span>500</span>
                      <span>1000</span>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
                  💡 **Comment utiliser ce chiffre lors de l'appel ?**
                  <br />
                  "D'après les statistiques des recherches à Montpellier, un restaurant de votre catégorie reçoit environ {missedCustomers} clics intentionnels par mois sur les fiches Google locales. Sans site web direct pour réserver ou commander, au moins 40% de ces clients partent chez vos concurrents. À {ticketPrice}€ de panier moyen, cela représente {monthlyLoss.toLocaleString('fr-FR')} € que vous laissez sur la table chaque mois."
                </div>
              </div>

              {/* Real-time Result card */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Perte Mensuelle</span>
                    <div className="text-4xl font-black text-white">{monthlyLoss.toLocaleString('fr-FR')} €</div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Perte Annuelle Estimée</span>
                    <div className="text-3xl font-black text-red-500">{yearlyLoss.toLocaleString('fr-FR')} €</div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Gain avec notre solution (40% de conversion)</span>
                    <div className="text-2xl font-black text-emerald-400">+{recoveryPotential.toLocaleString('fr-FR')} € / an</div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('pitch')}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white rounded-xl transition-all"
                  >
                    Voir l'Argumentaire de Vente <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

// Helpers sub-components
function TabButton({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border
        ${active ? 
          'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' : 
          'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function AuditItem({ checked, text }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-red-400 flex-shrink-0" />
      )}
      <span className={checked ? 'text-slate-300' : 'text-slate-400 line-through decoration-red-500/30'}>{text}</span>
    </li>
  );
}

function ActionStep({ num, title, desc }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-3">
      <span className="text-xl font-black text-indigo-500">{num}</span>
      <div className="space-y-1">
        <h6 className="text-xs font-bold text-white uppercase">{title}</h6>
        <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function DetailPill({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 pb-2">
      <span className="text-[10px] uppercase font-bold text-slate-500">{label}</span>
      <span className="text-xs text-slate-200 font-medium truncate">{value}</span>
    </div>
  );
}
