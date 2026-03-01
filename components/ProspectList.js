import React, { useState } from 'react';
import { Search, MapPin, Globe, Phone, Star, Zap, Copy, Check, X, Clock } from 'lucide-react';

export default function ProspectList({ prospects, onMarkContacted, onDelete }) {
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [promptType, setPromptType] = useState('internal');

    const handleDeepResearch = (prospect) => {
        setSelectedProspect(prospect);
        setPromptType('internal');
        setShowModal(true);
        setCopied(false);
    };

    const generateClientReportPrompt = (p) => {
        if (!p) return "";
        return `**RÔLE :** Tu es un consultant de haut niveau en stratégie digitale spécialisé dans les commerces locaux.
**TÂCHE :** Rédige un audit digital éclair et percutant, destiné à être lu DIRECTEMENT par le propriétaire de ce commerce. L'objectif est de lui faire réaliser de manière urgente son manque à gagner actuel et de lui démontrer les gains financiers exacts qu'il obtiendra en travaillant avec nous. Le ton doit être professionnel, extrêmement persuasif, rassurant et axé sur les résultats (ROI garanti).

**DÉTAILS DU PROSPECT :**
- **Nom de l'établissement :** ${p.name}
- **Ville :** ${p.city}
- **Secteur / Catégorie :** ${p.category}
- **Statut du site web :** ${p.website || "AUCUN SITE WEB DÉTECTÉ"}
- **Réputation (Google) :** ${p.rating} étoiles sur 5 (${p.reviews} avis)

**STRUCTURE EXACTE DU RAPPORT À PRODUIRE :**
1. **Introduction Accrocheuse :** Une phrase de politesse qui valorise leur commerce (basé sur l'excellente note ou le nombre d'avis) pour flatter leur ego d'entrepreneur.
2. **Le Problème Qui Coûte Cher :** Identifie le point de friction majeur. S'ils n'ont pas de site web, insiste lourdement sur le fait que leurs clients potentiels partent chez le concurrent le plus proche qui est visible en ligne.
3. **Le Manque à Gagner (Les Pertes Actuelles) :** Fais une estimation choc mais réaliste de l'argent qu'ils perdent chaque mois par manque de visibilité ou d'optimisation.
4. **Le Gisement de Croissance (LES GAINS POTENTIELS) :** C'est la partie la plus importante. Tu dois lister sous forme de points (bullet points) précis les futurs GAGNANTS si on leur crée un site web performant :
   - Combien de NOUVEAUX clients par mois (donne une estimation chiffrée basée sur leur ville/secteur).
   - Combien de chiffre d'affaires supplémentaire (en €) cela représente sur une année (fais un calcul simple : X clients x Y€ panier moyen = Z€ garantis).
   - L'augmentation de la valorisation de leur fonds de commerce.
   - Rassure-les : assure-leur que cet investissement est le plus rentable qu'ils puissent faire pour leur établissement aujourd'hui.
5. **Notre Recommandation "Quick-Win" :** Propose notre solution claire (création de site/tunnel de vente) comme l'évidence absolue pour capturer ce chiffre d'affaires perdu.

**CONTRAINTES :** Le texte final doit être formaté proprement (gras, bullet points), ultra persuasif, et prêt à être envoyé. Parle-leur directement (vouvoiement). Sois convaincant sur le fait qu'ils VONT gagner de l'argent.`;
    };

    const generateInternalStrategyPrompt = (p) => {
        if (!p) return "";
        return `**RÔLE :** Tu es le mentor des meilleurs "Closers" B2B. Tu prépares ton commercial avant un appel à froid (Cold Call) décisif.
**TÂCHE :** Crée une fiche de préparation ("Battle Card") ultra-concise, psychologique et tactique pour attaquer ce prospect avec un taux de conversion maximum.

**DÉTAILS DU PROSPECT (CIBLE) :**
- **Nom :** ${p.name}
- **Ville :** ${p.city}
- **Catégorie :** ${p.category}
- **Site Web :** ${p.website || "PAS DE SITE"}
- **Notes :** ${p.rating} étoiles (${p.reviews} avis)

**LIVRABLES POUR LE COMMERCIAL (DOIT ÊTRE LU EN 30 SECONDES) :**
1. **L'Icebreaker (L'Accroche) :** Trouve LA phrase d'ouverture ultra-spécifique (ex: "J'ai lu votre dernier avis", "J'ai cherché un [catégorie] à [ville] et j'ai remarqué un détail frustrant...") pour retenir son attention dès les 10 premières secondes.
2. **Le Point de Saignement (Pain Point) :** Quel est son pire cauchemar actuel ? (ex: Payer 30% de commission à UberEats, les tables vides le mardi, les clients qui vont chez le voisin car ils ne le trouvent pas sur Google).
3. **Le Pitch Sniper :** Un argumentaire éclair de 3 phrases, incisif, basé sur CE prospect précisément. Pas de blabla, que du ROI. Angle suggéré : ${!p.website ? "La souveraineté numérique (ne pas dépendre que des plateformes)." : "Maximiser la valeur de chaque visiteur du site."}
4. **Le Bouclier (Traitement des Objections) :** Donne-moi les 2 objections les plus probables qu'il va me balancer (ex: "J'ai pas le temps", "Ça coûte trop cher") et la réplique parfaite et inattendue pour chacune.

**CONTRAINTES :** Format "Commandos" (Bullet points, phrases très courtes, mots percutants). Écris pour le commercial.`;
    };

    const copyToClipboard = () => {
        const text = promptType === 'internal' ? generateInternalStrategyPrompt(selectedProspect) : generateClientReportPrompt(selectedProspect);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Business Name</th>
                            <th className="px-6 py-4 font-semibold">Location</th>
                            <th className="px-6 py-4 font-semibold">Digital Status</th>
                            <th className="px-6 py-4 font-semibold">Metrics</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {prospects.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white flex items-center gap-2">
                                        {p.name}
                                        {p.is_prospect_to_contact && !p.contacted && (
                                            <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                                                Hot Lead
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">{p.category}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm">{p.address || p.city}</div>
                                            {p.google_maps_url && (
                                                <a
                                                    href={p.google_maps_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-0.5 inline-block"
                                                >
                                                    Voir sur Maps ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {p.phone && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                            <Phone className="h-3 w-3" />
                                            {p.phone}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {p.has_website ? (
                                        <a
                                            href={p.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                                        >
                                            <Globe className="h-3.5 w-3.5" />
                                            Website Active
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2.5 py-1.5 text-xs font-medium text-amber-400">
                                            <X className="h-3.5 w-3.5" />
                                            No Website
                                        </span>
                                    )}
                                    {p.best_time_to_call && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-purple-400/10 px-2.5 py-1.5 text-xs font-medium text-purple-400 border border-purple-400/20">
                                            <Clock className="h-3.5 w-3.5" />
                                            Call: {p.best_time_to_call}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-medium text-white">{p.rating}</span>
                                        <span className="text-slate-500">({p.reviews})</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeepResearch(p)}
                                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-blue-400 transition-colors"
                                    >
                                        <Zap className="h-3.5 w-3.5" />
                                        Deep Research
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {!p.contacted && (
                                            <button
                                                onClick={() => onMarkContacted(p.id)}
                                                className="rounded-lg bg-green-500/10 p-2 text-green-500 hover:bg-green-500/20 transition-colors"
                                                title="Mark Contacted"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(p.id)}
                                            className="rounded-lg bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 transition-colors"
                                            title="Delete"
                                        >
                                            <img src="https://api.iconify.design/lucide:trash-2.svg?color=%23ef4444" className="h-4 w-4" alt="delete" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 bg-slate-800">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                Deep Research: {selectedProspect.name}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Tabs for Prompt Types */}
                            <div className="flex items-center gap-4 mb-6 border-b border-slate-700/50 pb-4">
                                <button
                                    onClick={() => setPromptType('internal')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${promptType === 'internal'
                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    Stratégie Interne (Appel)
                                </button>
                                <button
                                    onClick={() => setPromptType('client')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${promptType === 'client'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    Rapport pour le Client
                                </button>
                            </div>

                            <p className="mb-4 text-sm text-slate-400">
                                Copie ce prompt et colle-le dans ChatGPT ou Claude pour générer ton contenu.
                            </p>

                            <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-300 border border-slate-800">
                                <pre className="whitespace-pre-wrap break-words">
                                    {promptType === 'internal' ? generateInternalStrategyPrompt(selectedProspect) : generateClientReportPrompt(selectedProspect)}
                                </pre>

                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-2 right-2 flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy Prompt
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 bg-slate-800/50 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
