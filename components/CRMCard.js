import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, MapPin } from 'lucide-react';

const Card = memo(({ item, index, setSelectedProspect, setCallProspect }) => {
    return (
        <Draggable draggableId={item.id.toString()} index={index}>
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

                    {/* 30s Brief Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {!item.has_website && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                🚀 Opportunité (Pas de site)
                            </span>
                        )}
                        {item.rating > 0 && item.rating < 4 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                                ⭐ Mal noté ({item.rating})
                            </span>
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
                            {/* Smart Call Button */}
                            {item.phone && (
                                <button
                                    onClick={() => setCallProspect(item)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500 text-slate-400 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                    title="Start Call Mode"
                                >
                                    <Phone className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default Card;
