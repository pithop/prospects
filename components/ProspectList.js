import React, { useState } from 'react';
import { Search, MapPin, Globe, Phone, Star, Zap, Copy, Check, X, Clock } from 'lucide-react';

export default function ProspectList({ prospects, onMarkContacted, onDelete }) {
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDeepResearch = (prospect) => {
        setSelectedProspect(prospect);
        setShowModal(true);
        setCopied(false);
    };

    const generatePrompt = (p) => {
        if (!p) return "";
        return `**RÔLE :** Tu es un chercheur commercial d'élite pour une agence digitale.
**TÂCHE :** Effectue une "Recherche Approfondie" sur ce prospect spécifique pour préparer un appel ou un email de prospection.
**DÉTAILS DU PROSPECT :**
- **Nom :** ${p.name}
- **Adresse :** ${p.address || "N/A"}
- **Ville :** ${p.city}
- **Catégorie :** ${p.category}
- **Site Web :** ${p.website || "PAS DE SITE WEB (Utilise Google Maps/Facebook)"}
- **Note Actuelle :** ${p.rating} étoiles (${p.reviews} avis)

**SORTIE REQUISE :**
1.  **Bilan de Santé Numérique :** Analyse rapidement leur présence en ligne. Ont-ils un site ? Est-il mobile-friendly ? Ont-ils un lien vers leur menu ?
2.  **L'Accroche ("Hook") :** Trouve UNE chose spécifique à mentionner (ex: "J'ai vu votre avis récent sur...", "J'ai remarqué que votre menu est un PDF...").
3.  **Le Point de Douleur ("Pain Point") :** Basé sur leur catégorie (${p.category}) et leur note, quel est probablement leur plus gros problème ? (ex: Commissions ? Tables vides le mardi soir ?)
4.  **Le Pitch :** Rédige une "Ouverture de Script" de 3 phrases spécifiquement pour ce propriétaire d'entreprise.
5.  **Angle de Vente :** ${!p.website ? "Ils n'ont PAS DE SITE WEB. Concentre-toi sur la 'Souveraineté Numérique' et le 'Risque Google Business Profile'." : "Ils ont un site web. Concentre-toi sur l'Optimisation de la Conversion' ou la 'Commande en Ligne'."}

**Garde cela concis, exploitable et prêt à être lu par un commercial en 30 secondes.**`;
    };

    const copyToClipboard = () => {
        const text = generatePrompt(selectedProspect);
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
                            <p className="mb-4 text-sm text-slate-400">
                                Copy this prompt and paste it into Gemini/ChatGPT to get a full sales briefing.
                            </p>

                            <div className="relative rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-300 border border-slate-800">
                                <pre className="whitespace-pre-wrap break-words">
                                    {generatePrompt(selectedProspect)}
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
