import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, ChevronDown, Check } from 'lucide-react';

export default function CityFilter({ cities, selectedCity, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const filteredCities = cities.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 h-10 px-4 rounded-xl border transition-all duration-300
          ${isOpen
                        ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-750'
                    }
        `}
            >
                <MapPin className={`h-4 w-4 ${selectedCity ? 'text-primary' : 'text-slate-500'}`} />
                <span className="font-medium text-sm truncate max-w-[140px]">
                    {selectedCity || "Toutes les villes"}
                </span>
                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-12 left-0 z-50 w-72 origin-top-left animate-in fade-in zoom-in-95 duration-200">
                    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl">

                        {/* Search Header */}
                        <div className="sticky top-0 p-3 border-b border-slate-700/50 bg-slate-900/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-8 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="Rechercher une ville..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cities List */}
                        <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <button
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors
                            ${!selectedCity ? 'bg-primary/10 text-primary' : 'text-slate-300 hover:bg-slate-800'}
                        `}
                            >
                                <span className="font-medium">🌎 Toutes les villes</span>
                                {!selectedCity && <Check className="h-4 w-4" />}
                            </button>

                            {filteredCities.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-slate-500 italic">
                                    Aucune ville trouvée
                                </div>
                            ) : (
                                filteredCities.map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => { onChange(city); setIsOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                                    ${selectedCity === city
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }
                                `}
                                    >
                                        <span>{city}</span>
                                        {selectedCity === city && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-950/30 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                            <span>{cities.length} villes disponibles</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
