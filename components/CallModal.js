import React, { useState, useEffect } from 'react';
import { Phone, X, QrCode, MessageSquare, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // We need to install this: npm i qrcode.react
import BattleCard from './BattleCard';

export default function CallModal({ prospect, onClose, onUpdateStatus }) {
    const [isMobile, setIsMobile] = useState(false);
    const [showGatekeeperOptions, setShowGatekeeperOptions] = useState(false);

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    const handleOutcome = (status) => {
        onUpdateStatus(prospect.id, status);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Call Interface */}
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${prospect.rating >= 4.5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <Phone className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{prospect.name}</h2>
                                <p className="text-slate-400">{prospect.category} • {prospect.city}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">

                        {/* Huge Phone Number */}
                        <div className="font-mono text-5xl md:text-7xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 select-all">
                            {prospect.phone?.replace(/(\d{2})(?=\d)/g, '$1 ')}
                        </div>

                        {/* Connection Method */}
                        <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                            {isMobile ? (
                                <a
                                    href={`tel:${prospect.phone}`}
                                    className="flex items-center justify-center gap-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                                >
                                    <Phone className="h-6 w-6" />
                                    Tap to Call
                                </a>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-xl">
                                        <QRCodeSVG value={`tel:${prospect.phone}`} size={160} />
                                    </div>
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                        <QrCode className="h-4 w-4" />
                                        Scan with phone to dial
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Outcome Actions */}
                    <div className="p-6 bg-slate-950 border-t border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Log Call Outcome</p>

                        {!showGatekeeperOptions ? (
                            <div className="grid grid-cols-4 gap-3">
                                <button onClick={() => handleOutcome('retry')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 group transition-all">
                                    <span className="p-2 rounded-full bg-slate-700 group-hover:bg-slate-600 text-slate-300"><Clock className="h-5 w-5" /></span>
                                    <span className="text-xs font-medium text-slate-400">No Answer</span>
                                </button>

                                <button onClick={() => setShowGatekeeperOptions(true)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 group transition-all">
                                    <span className="p-2 rounded-full bg-orange-500/20 group-hover:bg-orange-500/30 text-orange-400"><Zap className="h-5 w-5" /></span>
                                    <span className="text-xs font-medium text-orange-400">Barrage</span>
                                </button>

                                <button onClick={() => handleOutcome('interested')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 group transition-all">
                                    <span className="p-2 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 text-emerald-400"><CheckCircle className="h-5 w-5" /></span>
                                    <span className="text-xs font-medium text-emerald-400">Interested</span>
                                </button>

                                <button onClick={() => handleOutcome('not-interested')} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 group transition-all">
                                    <span className="p-2 rounded-full bg-red-500/20 group-hover:bg-red-500/30 text-red-400"><XCircle className="h-5 w-5" /></span>
                                    <span className="text-xs font-medium text-red-400">Rejected</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 animate-in slide-in-from-right duration-200">
                                <button onClick={() => handleOutcome('retry')} className="flex-1 p-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-bold flex items-center justify-center gap-2">
                                    <XCircle className="h-5 w-5" />
                                    Bloqué (Rappeler)
                                </button>
                                <button onClick={() => handleOutcome('contacted')} className="flex-1 p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Passé (Parler au Manager)
                                </button>
                                <button onClick={() => setShowGatekeeperOptions(false)} className="px-4 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Battle Cards (Side Panel) */}
                <BattleCard prospect={prospect} />

            </div>
        </div>
    );
}
