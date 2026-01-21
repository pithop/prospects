import React, { useState } from 'react';
import { Zap, ChevronDown } from 'lucide-react';

export default function BattleCard({ prospect }) {
    return (
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-bold text-white">Battle Cards</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Dynamic Context */}
                {prospect && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                        <p className="text-xs font-bold text-indigo-400 uppercase mb-1">🎯 Quick Angle</p>
                        <p className="text-sm text-indigo-100 italic">
                            "{!prospect.has_website ? "Je ne trouve pas votre site sur Google..." : prospect.rating < 4 ? `J'ai vu que vous aviez ${prospect.rating} étoiles...` : "J'adore vos avis clients..."}"
                        </p>
                    </div>
                )}
                {/* Objection Handlers */}
                <Objection
                    title="💰 C'est trop cher"
                    script="C'est justement parce que ça coûte cher de perdre des clients qu'on doit en parler. Un seul client fidèle rembourse l'année."
                />
                <Objection
                    title="✋ Pas intéressé"
                    script="Je comprends. Juste pour savoir, vous gérez comment vos avis Google aujourd'hui ? C'est le #1 facteur de choix."
                />
                <Objection
                    title="📧 Envoyez un email"
                    script="Avec plaisir. Pour que ce soit pertinent, c'est quoi votre priorité ce mois-ci ? Les avis ou le site web ?"
                />
                <Objection
                    title="📅 Rappelez plus tard"
                    script="Ok, mardi 10h ou jeudi 14h ? Je note."
                />
                <Objection
                    title="🤥 J'ai déjà quelqu'un"
                    script="Top. Est-ce qu'ils vous fournissent aussi une analyse des avis négatifs pour améliorer votre service ?"
                />
            </div>
        </div>
    );
}

function Objection({ title, script }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-700 bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-slate-600 transition-colors" onClick={() => setIsOpen(!isOpen)}>
            <div className="p-3 flex items-center justify-between font-medium text-slate-300">
                {title}
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="p-3 bg-slate-950/50 text-emerald-400 text-sm border-t border-slate-700 animate-in slide-in-from-top-2">
                    "{script}"
                </div>
            )}
        </div>
    );
}
