import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayoutDashboard, Users, Mail, Phone, ExternalLink, MapPin, Search, Filter } from 'lucide-react';
import EmailGenerator from '@/components/EmailGenerator';
import CRMCard from '@/components/CRMCard';

export default function CRM() {
    const [allProspects, setAllProspects] = useState([]); // Store fetched data
    const [columns, setColumns] = useState({
        'nouveau': { id: 'nouveau', title: 'Nouveaux', items: [] },
        'contacted': { id: 'contacted', title: 'Contactés', items: [] },
        'interested': { id: 'interested', title: 'Intéressés', items: [] },
        'signed': { id: 'signed', title: 'Signés', items: [] }
    });
    const [loading, setLoading] = useState(true);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState(''); // Empty initially
    const [cities, setCities] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 1. Fetch Cities First
    useEffect(() => {
        fetchCities();
    }, []);

    // 2. Fetch Prospects when City Changes
    useEffect(() => {
        if (cityFilter) {
            fetchProspects(cityFilter);
        }
    }, [cityFilter]);

    // 3. Re-distribute locally only when search query changes (lightweight)
    useEffect(() => {
        if (!loading && allProspects.length > 0) {
            distributeProspects(allProspects);
        }
    }, [searchQuery, allProspects]);

    const fetchCities = async () => {
        try {
            const res = await fetch('/api/cities');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setCities(data);
                setCityFilter(data[0]); // Default to first city to auto-load
            } else {
                setLoading(false); // No data exists
            }
        } catch (err) {
            console.error("Failed to load cities", err);
            setLoading(false);
        }
    };

    const fetchProspects = async (city) => {
        setLoading(true);
        try {
            // Fetch heavily filtered data from server
            // We increase limit to 2000 because we are now strictly scoping to ONE city
            const res = await fetch(`/api/prospects?city=${encodeURIComponent(city)}&limit=2000`);
            const data = await res.json();
            const prospects = Array.isArray(data) ? data : data.data;

            setAllProspects(prospects);
            distributeProspects(prospects);
            setLoading(false);
            setIsInitialLoad(false);
        } catch (err) {
            console.error("Failed to load CRM data", err);
            setLoading(false);
        }
    };

    const distributeProspects = (prospects) => {
        const newColumns = {
            'nouveau': { id: 'nouveau', title: 'Nouveaux 🆕', items: [] },
            'contacted': { id: 'contacted', title: 'Contactés 📩', items: [] },
            'interested': { id: 'interested', title: 'Intéressés 🔥', items: [] },
            'signed': { id: 'signed', title: 'Signés 🤝', items: [] }
        };

        const lowerSearch = searchQuery.toLowerCase();

        prospects.forEach(p => {
            // Client-side text search (fast because we only have ~500-2000 items now)
            if (searchQuery && !p.name.toLowerCase().includes(lowerSearch) && !p.category?.toLowerCase().includes(lowerSearch)) return;

            const status = p.status && newColumns[p.status] ? p.status : 'nouveau';
            newColumns[status].items.push(p);
        });

        setColumns(newColumns);
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination } = result;
        const draggableId = result.draggableId;

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];

        if (source.droppableId === destination.droppableId) {
            const newItems = Array.from(sourceColumn.items);
            const [removed] = newItems.splice(source.index, 1);
            newItems.splice(destination.index, 0, removed);
            setColumns({ ...columns, [source.droppableId]: { ...sourceColumn, items: newItems } });
        } else {
            const sourceItems = Array.from(sourceColumn.items);
            const destItems = Array.from(destColumn.items);
            const [removed] = sourceItems.splice(source.index, 1);

            const updatedItem = { ...removed, status: destination.droppableId };
            destItems.splice(destination.index, 0, updatedItem);

            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: sourceItems },
                [destination.droppableId]: { ...destColumn, items: destItems }
            });

            setAllProspects(prev => prev.map(p =>
                p.id.toString() === draggableId ? { ...p, status: destination.droppableId } : p
            ));

            try {
                await fetch('/api/prospects', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: Number(draggableId), status: destination.droppableId })
                });
            } catch (err) {
                console.error("Failed to update status", err);
            }
        }
    };

    if (loading && isInitialLoad) return (
        <div className="flex h-screen items-center justify-center bg-[#050505] text-slate-400">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-500/50" />
                    </div>
                </div>
                <p className="text-sm font-medium tracking-wide text-indigo-400/80 animate-pulse">LOADING PIPELINE...</p>
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
            <Head>
                <title>ProspectHub CRM</title>
            </Head>

            {/* Premium Glass Header */}
            <div className="flex-none border-b border-white/5 bg-black/20 backdrop-blur-md px-6 py-4 z-10">
                <div className="mx-auto max-w-[1920px] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Users className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                ProspectHub <span className="text-indigo-500">Pipeline</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                                {allProspects.length} Leads in {cityFilter}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Pill */}
                        <div className="group relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:bg-white/10 focus-within:border-indigo-500/50 transition-all">
                            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search this city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 w-48 ml-2"
                            />
                        </div>

                        {/* City Filter Pill - NOW PRIMARY CONTROL */}
                        <div className="relative group">
                            <div className="flex items-center bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 hover:bg-indigo-500/20 transition-all">
                                <Filter className="h-3 w-3 text-indigo-400 mr-2" />
                                <select
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    className="bg-transparent border-none text-sm text-indigo-100 focus:outline-none focus:ring-0 appearance-none cursor-pointer pr-4 font-bold"
                                >
                                    {cities.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        <a href="/" className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20 flex items-center gap-2">
                            <LayoutDashboard className="h-3 w-3" />
                            EXIT
                        </a>
                    </div>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className={`flex-1 overflow-x-auto overflow-y-hidden p-6 relative transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[7000ms]"></div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="mx-auto max-w-[1920px] h-full grid grid-cols-1 md:grid-cols-4 gap-6 min-w-[1200px] relative z-10">
                        {Object.entries(columns).map(([columnId, column]) => (
                            <div key={columnId} className="flex h-full flex-col rounded-2xl bg-[#0f1115]/60 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden group">
                                {/* Column Header */}
                                <div className={`flex-none p-4 border-b border-white/5 flex items-center justify-between bg-white/5 transition-colors
                                    ${columnId === 'nouveau' && 'group-hover:bg-blue-500/5'}
                                    ${columnId === 'contacted' && 'group-hover:bg-amber-500/5'}
                                    ${columnId === 'interested' && 'group-hover:bg-purple-500/5'}
                                    ${columnId === 'signed' && 'group-hover:bg-emerald-500/5'}
                                `}>
                                    <div>
                                        <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2
                                            ${columnId === 'nouveau' && 'text-blue-400'}
                                            ${columnId === 'contacted' && 'text-amber-400'}
                                            ${columnId === 'interested' && 'text-purple-400'}
                                            ${columnId === 'signed' && 'text-emerald-400'}
                                        `}>
                                            {column.title}
                                        </h2>
                                    </div>
                                    <span className="flex items-center justify-center h-6 min-w-[24px] rounded-full bg-black/40 text-[10px] font-bold text-white border border-white/5 px-1.5">
                                        {column.items.length}
                                    </span>
                                </div>

                                {/* Scrollable Content Area */}
                                <Droppable droppableId={columnId}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors
                                                ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}
                                            `}
                                        >
                                            {column.items.map((item, index) => (
                                                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
                                                                glass-card group/card relative rounded-xl p-4 cursor-grab
                                                                hover:bg-slate-800/80 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 
                                                                ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl ring-1 ring-indigo-500/50 bg-[#1a1d24] z-50' : ''}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            {/* Card Content */}
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-bold text-sm text-slate-200 truncate pr-2 group-hover/card:text-white transition-colors">{item.name}</h3>
                                                                {item.rating > 0 && (
                                                                    <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold
                                                                        ${item.rating >= 4.5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500'}
                                                                    `}>
                                                                        {item.rating}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2 mb-3">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 group-hover/card:text-slate-400 transition-colors">
                                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                                    <span className="truncate">{item.city}</span>
                                                                </div>
                                                                {item.website && (
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <div className={`h-1.5 w-1.5 rounded-full ${item.has_website ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                                                                        <a href={item.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 hover:underline truncate transition-colors">
                                                                            {new URL(item.website).hostname.replace('www.', '')}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Footer Actions */}
                                                            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2 opacity-60 group-hover/card:opacity-100 transition-opacity">
                                                                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">
                                                                    {item.category?.split(' ')[0]}
                                                                </span>

                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => setSelectedProspect(item)}
                                                                        className="p-1.5 rounded-lg hover:bg-indigo-500 text-slate-400 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                                                        title="AI Roast"
                                                                    >
                                                                        <Mail className="h-3 w-3" />
                                                                    </button>
                                                                    {item.phone && (
                                                                        <a href={`tel:${item.phone}`} className="p-1.5 rounded-lg hover:bg-emerald-500 text-slate-400 hover:text-white transition-all transform hover:scale-110 shadow-sm">
                                                                            <Phone className="h-3 w-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>

                {selectedProspect && (
                    <EmailGenerator prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
                )}
            </div>
        </div>
    );
}
