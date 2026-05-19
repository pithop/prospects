import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '@/components/StrictModeDroppable';
import { LayoutDashboard, Users, Mail, Phone, ExternalLink, MapPin, Search, Filter, Zap } from 'lucide-react';
import EmailGenerator from '@/components/EmailGenerator';
import CallModal from '@/components/CallModal';
import ProspectDossier from '@/components/ProspectDossier';

/**
 * V2 CRM Pipeline — Uses ONLY /api/v2/* endpoints.
 * The legacy /crm page continues to work with /api/prospects unchanged.
 */
export default function CRMV2() {
    const [allProspects, setAllProspects] = useState([]);
    const [columns, setColumns] = useState({
        'retry':      { id: 'retry',      title: 'À rappeler ⏳',  items: [] },
        'contacted':  { id: 'contacted',  title: 'Contactés 📩',   items: [] },
        'interested': { id: 'interested', title: 'Intéressés 🔥',  items: [] },
        'signed':     { id: 'signed',     title: 'Signés 🤝',      items: [] },
    });
    const [loading, setLoading] = useState(true);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [callProspect, setCallProspect] = useState(null);
    const [dossierProspect, setDossierProspect] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [cities, setCities] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => { fetchCities(); }, []);
    useEffect(() => { if (cityFilter) fetchProspects(cityFilter); }, [cityFilter]);
    useEffect(() => {
        if (!loading && allProspects.length > 0) distributeProspects(allProspects);
    }, [searchQuery, allProspects]);

    const fetchCities = async () => {
        try {
            const res = await fetch('/api/v2/cities');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setCities(data);
                setCityFilter(data[0]);
            } else { setLoading(false); }
        } catch { setLoading(false); }
    };

    const fetchProspects = async (city) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v2/prospects?city=${encodeURIComponent(city)}&limit=2000`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setAllProspects(list);
            distributeProspects(list);
        } catch (err) { console.error('V2 CRM load error', err); }
        setLoading(false);
        setIsInitialLoad(false);
    };

    const distributeProspects = (list) => {
        const cols = {
            'retry':      { id: 'retry',      title: 'À rappeler ⏳',  items: [] },
            'contacted':  { id: 'contacted',  title: 'Contactés 📩',   items: [] },
            'interested': { id: 'interested', title: 'Intéressés 🔥',  items: [] },
            'signed':     { id: 'signed',     title: 'Signés 🤝',      items: [] },
        };
        const q = searchQuery.toLowerCase();
        list.forEach(p => {
            if (q && !p.name.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return;
            if (p.status === 'no-answer') p.status = 'retry';
            if (p.status && cols[p.status]) cols[p.status].items.push(p);
        });
        setColumns(cols);
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination } = result;
        const draggableId = result.draggableId;

        const srcCol  = columns[source.droppableId];
        const dstCol  = columns[destination.droppableId];

        if (source.droppableId === destination.droppableId) {
            const items = Array.from(srcCol.items);
            const [removed] = items.splice(source.index, 1);
            items.splice(destination.index, 0, removed);
            setColumns({ ...columns, [source.droppableId]: { ...srcCol, items } });
        } else {
            const srcItems = Array.from(srcCol.items);
            const dstItems = Array.from(dstCol.items);
            const [removed] = srcItems.splice(source.index, 1);
            const updated = { ...removed, status: destination.droppableId };
            dstItems.splice(destination.index, 0, updated);
            setColumns({
                ...columns,
                [source.droppableId]:      { ...srcCol,  items: srcItems },
                [destination.droppableId]:  { ...dstCol,  items: dstItems },
            });
            setAllProspects(prev => prev.map(p => p.id.toString() === draggableId ? { ...p, status: destination.droppableId } : p));

            // Persist via V2 API
            try {
                await fetch('/api/v2/prospects', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: draggableId, status: destination.droppableId })
                });
            } catch (err) { console.error('V2 status update failed', err); }
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        setAllProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        distributeProspects(allProspects.map(p => p.id === id ? { ...p, status: newStatus } : p));
        try {
            await fetch('/api/v2/prospects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
        } catch (err) { console.error('V2 status update failed', err); }
    };

    const toggleSelection = (id) => {
        const s = new Set(selectedIds);
        s.has(id) ? s.delete(id) : s.add(id);
        setSelectedIds(s);
    };

    const handleExportCSV = () => {
        const data = selectedIds.size > 0 ? allProspects.filter(p => selectedIds.has(p.id)) : allProspects;
        if (!data.length) return alert('Nothing to export');
        const headers = ['ID','Name','Phone','Email','Website','City','Category','Status','Rating'];
        const rows = data.map(p => [
            p.id,
            `"${(p.name||'').replace(/"/g,'""')}"`,
            `"${(p.phone||'').replace(/"/g,'""')}"`,
            `"${(p.email||'').replace(/"/g,'""')}"`,
            p.website||'',
            `"${(p.city||'').replace(/"/g,'""')}"`,
            `"${(p.category||'').replace(/"/g,'""')}"`,
            p.status,
            p.rating
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prospects_v2_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    if (loading && isInitialLoad) return (
        <div className="flex h-screen items-center justify-center bg-[#050505] text-slate-400">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center"><Users className="h-6 w-6 text-indigo-500/50" /></div>
                </div>
                <p className="text-sm font-medium tracking-wide text-indigo-400/80 animate-pulse">LOADING V2 PIPELINE...</p>
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
            <Head><title>ProspectHub CRM V2</title></Head>

            {/* Header */}
            <div className="flex-none border-b border-white/5 bg-black/20 backdrop-blur-md px-6 py-4 z-10">
                <div className="mx-auto max-w-[1920px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20"><Users className="h-6 w-6 text-indigo-400" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">ProspectHub <span className="text-indigo-500">Pipeline V2</span></h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{allProspects.length} Leads in {cityFilter}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="group relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-indigo-500/50 transition-all">
                            <Search className="h-4 w-4 text-slate-500" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none w-48 ml-2" />
                        </div>
                        <button onClick={handleExportCSV} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                            <ExternalLink className="h-3 w-3" />{selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export All'}
                        </button>
                        <div className="relative group">
                            <div className="flex items-center bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5">
                                <Filter className="h-3 w-3 text-indigo-400 mr-2" />
                                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="bg-transparent border-none text-sm text-indigo-100 focus:outline-none appearance-none cursor-pointer pr-4 font-bold">
                                    {cities.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                        <a href="/reports" className="px-4 py-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-400 transition-all border border-indigo-500/20 flex items-center gap-2">Rapports</a>
                        <a href="/v2" className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5 flex items-center gap-2">
                            <LayoutDashboard className="h-3 w-3" />Dashboard V2
                        </a>
                        <a href="/" className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5 flex items-center gap-2">V1 Legacy</a>
                    </div>
                </div>
            </div>

            {/* Kanban */}
            <div className={`flex-1 overflow-x-auto overflow-y-hidden p-6 relative transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="mx-auto max-w-[1920px] h-full grid grid-cols-1 md:grid-cols-4 gap-6 min-w-[1200px] relative z-10">
                        {Object.entries(columns).map(([colId, col]) => (
                            <div key={colId} className="flex h-full flex-col rounded-2xl bg-[#0f1115]/60 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden group">
                                <div className="flex-none p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <h2 className={`text-sm font-bold uppercase tracking-wider ${colId === 'retry' ? 'text-orange-400' : colId === 'contacted' ? 'text-amber-400' : colId === 'interested' ? 'text-purple-400' : 'text-emerald-400'}`}>{col.title}</h2>
                                    <span className="flex items-center justify-center h-6 min-w-[24px] rounded-full bg-black/40 text-[10px] font-bold text-white border border-white/5 px-1.5">{col.items.length}</span>
                                </div>
                                <StrictModeDroppable droppableId={colId}>
                                    {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto p-3 space-y-3 ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}>
                                            {col.items.map((item, index) => (
                                                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                    {(prov, snap) => (
                                                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={prov.draggableProps.style}
                                                            className={`glass-card group/card relative rounded-xl p-4 cursor-grab hover:bg-slate-800/80 hover:border-indigo-500/30 ${snap.isDragging ? 'rotate-2 scale-105 shadow-2xl ring-1 ring-indigo-500/50 bg-[#1a1d24] z-50' : ''} ${selectedIds.has(item.id) ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''}`}
                                                        >
                                                            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={e => { e.stopPropagation(); toggleSelection(item.id); }} className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500" />
                                                            </div>
                                                            <div className="flex justify-between items-start mb-2 pr-6">
                                                                <h3 className="font-bold text-sm text-slate-200 truncate pr-2">{item.name}</h3>
                                                                {item.rating > 0 && <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${item.rating >= 4.5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}`}>{item.rating}</div>}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {!item.has_website && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">🚀 Pas de site</span>}
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2 mb-3"><MapPin className="h-3 w-3" /><span className="truncate">{item.city}</span></div>
                                                            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2 opacity-60 group-hover/card:opacity-100 transition-opacity">
                                                                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">{item.category?.split(' ')[0]}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <button onClick={e => { e.stopPropagation(); setDossierProspect(item); }} className="p-1.5 rounded-lg hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all" title="Dossier"><Zap className="h-3 w-3" /></button>
                                                                    <button onClick={e => { e.stopPropagation(); setSelectedProspect(item); }} className="p-1.5 rounded-lg hover:bg-indigo-500 text-slate-400 hover:text-white transition-all" title="Email"><Mail className="h-3 w-3" /></button>
                                                                    {item.phone && <button onClick={e => { e.stopPropagation(); setCallProspect(item); }} className="p-1.5 rounded-lg hover:bg-emerald-500 text-slate-400 hover:text-white transition-all" title="Call"><Phone className="h-3 w-3" /></button>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </StrictModeDroppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>

                {/* Modals */}
                {selectedProspect && <EmailGenerator prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />}
                {callProspect && <CallModal prospect={callProspect} onClose={() => setCallProspect(null)} onUpdateStatus={handleStatusUpdate} />}
                {dossierProspect && (
                    <ProspectDossier
                        prospect={dossierProspect}
                        onClose={() => setDossierProspect(null)}
                        onActionClick={(type, p) => {
                            setDossierProspect(null);
                            if (type === 'email') setSelectedProspect(p);
                            if (type === 'call') setCallProspect(p);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
