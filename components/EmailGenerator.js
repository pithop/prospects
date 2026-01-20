import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Copy, ExternalLink, Zap } from 'lucide-react';

export default function EmailGenerator({ prospect, onClose }) {
    const [template, setTemplate] = useState('roast');
    const [generatedEmail, setGeneratedEmail] = useState({ subject: '', body: '' });

    useEffect(() => {
        if (prospect) generateEmail(template);
    }, [prospect, template]);

    const generateEmail = (type) => {
        if (!prospect) return;

        let subject = '';
        let body = '';
        const firstName = prospect.name.split(' ')[0] || 'Patron';

        // LOGIC: The "AI Roast" Algorithm
        const hasWebsite = prospect.has_website && !prospect.is_third_party;
        const isLowRated = prospect.rating > 0 && prospect.rating < 4.0;
        const isHighRated = prospect.rating >= 4.5;
        const city = prospect.city || 'votre ville';

        if (type === 'roast') {
            subject = `Question sur ${prospect.name}`;

            if (!hasWebsite) {
                body = `Bonjour,\n\nJ'ai essayé de trouver votre carte en ligne pour ${prospect.name}, mais impossible de trouver un site web.\n\nSavez-vous que vous perdez environ 30% de clients potentiels à ${city} juste à cause de ça ?\n\nJ'aide les restaurateurs à régler ça en 48h. Dispo pour en parler ?\n\nCordialement,`;
            } else if (isLowRated) {
                body = `Bonjour,\n\nJe regardais les restos à ${city} et j'ai vu votre note de ${prospect.rating}/5 pour ${prospect.name}.\n\nC'est dommage parce que ça fait fuir les touristes, alors que votre cuisine est sûrement top.\n\nOn a une méthode pour remonter la note rapidement. Ça vous intéresse ?\n\nCordialement,`;
            } else {
                body = `Bonjour,\n\nJe viens de voir votre site pour ${prospect.name}. Félicitations pour la note de ${prospect.rating}, c'est rare !\n\nPar contre, votre site ne rend pas justice à votre réputation. Il y a 2-3 trucs qui bloquent les commandes sur mobile.\n\nJe peux vous envoyer une vidéo rapide pour vous montrer ?\n\nCordialement,`;
            }
        } else if (type === 'audit') {
            subject = `Audit rapide pour ${prospect.name}`;
            body = `Bonjour,\n\nJ'ai fait un rapide audit SEO de votre présence à ${city}.\n\nRésultat : Vos concurrents vous passent devant sur Google Maps, principalement parce que votre fiche manque d'infos clés.\n\nJe peux vous envoyer le rapport PDF gratuitement si vous voulez.\n\nBonne journée,`;
        } else if (type === 'network') {
            subject = `Partenariat local / ${prospect.name}`;
            body = `Bonjour,\n\nJe suis développeur web basé pas loin de ${city}. J'adore ce que vous faites avec ${prospect.name} (surtout les avis à ${prospect.rating} !).\n\nJe cherche à booster un seul restaurant dans votre quartier ce mois-ci. Ça vous dit qu'on en discute 5 min ?\n\nÀ bientôt,`;
        }

        setGeneratedEmail({ subject, body });
    };

    const handleLaunchGmail = () => {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
        window.location.href = mailtoLink;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${generatedEmail.subject}\n\n${generatedEmail.body}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4 bg-slate-800">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        AI Roast Generator: <span className="text-slate-300">{prospect.name}</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-6">
                    {/* Template Selection */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setTemplate('roast')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${template === 'roast' ? 'bg-red-500/10 border-red-500 text-red-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            🔥 The Roast
                        </button>
                        <button
                            onClick={() => setTemplate('audit')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${template === 'audit' ? 'bg-blue-500/10 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            📊 Value Audit
                        </button>
                        <button
                            onClick={() => setTemplate('network')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${template === 'network' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            🤝 Soft Network
                        </button>
                    </div>

                    {/* Email Preview */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</label>
                            <div className="mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 font-medium">
                                {generatedEmail.subject}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Body</label>
                            <div className="mt-1 p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap h-48 overflow-y-auto font-mono text-sm">
                                {generatedEmail.body}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleLaunchGmail}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02]"
                        >
                            <Mail className="h-5 w-5" />
                            Open in Gmail
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl border border-slate-700 transition-colors"
                        >
                            <Copy className="h-5 w-5" />
                            Copy
                        </button>
                    </div>

                    <div className="mt-4 text-center text-xs text-slate-500">
                        🚀 Pro Tip: Sending manually works 10x better than automated tools.
                    </div>
                </div>
            </div>
        </div>
    );
}
