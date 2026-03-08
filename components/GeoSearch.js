import React, { useState } from 'react';
import { Search, MapPin, Navigation, Crosshair, Loader2 } from 'lucide-react';

export default function GeoSearch({ onSearch }) {
    const [query, setQuery] = useState('');
    const [radius, setRadius] = useState(5); // Default 5km
    const [limit, setLimit] = useState(50); // Default 50 prospects
    const [isLocating, setIsLocating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Get user's current GPS location
    const handleGetMyLocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                setQuery('Ma Position Actuelle');
                onSearch({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    radius,
                    limit
                });
            },
            (error) => {
                setIsLocating(false);
                alert("Erreur de géolocalisation. Veuillez autoriser l'accès à votre position.");
            }
        );
    };

    // Use OpenStreetMap Nominatim API to find coordinates from text (e.g. "Comédie Montpellier")
    const handleTextSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: {
                    'Accept-Language': 'fr' // Prefer french results
                }
            });
            const data = await res.json();

            if (data && data.length > 0) {
                const location = data[0];
                onSearch({
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lon),
                    radius,
                    limit,
                    name: location.display_name.split(',')[0] // Clean display name
                });
            } else {
                alert("Lieu introuvable. Essayez d'être plus précis (ex: Comédie, Montpellier)");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Erreur lors de la recherche du lieu.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 w-full mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">

                {/* Text Search Form */}
                <form onSubmit={handleTextSearch} className="flex-1 w-full relative">
                    <div className="relative flex items-center bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 focus-within:border-indigo-500/50 focus-within:bg-slate-800/80 transition-all">
                        <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Chercher une zone (ex: Comédie Montpellier)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none w-full"
                        />
                        <button type="submit" disabled={isSearching} className="ml-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </button>
                    </div>
                </form>

                {/* Separator */}
                <span className="text-slate-600 font-medium text-xs uppercase hidden md:block">OU</span>

                {/* My Location Button */}
                <button
                    onClick={handleGetMyLocation}
                    disabled={isLocating}
                    className="flex-none flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-all w-full md:w-auto"
                >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                    Autour de moi
                </button>

                {/* Settings (Radius & Limit) */}
                <div className="flex items-center gap-4 bg-slate-900/30 p-2 rounded-lg border border-slate-800 w-full md:w-auto">
                    <div className="flex flex-col items-center">
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1">Rayon ({radius}km)</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value))}
                            className="w-24 accent-indigo-500"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex flex-col items-center">
                        <label className="text-[10px] text-slate-500 font-bold uppercase mb-1">Afficher</label>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                            className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer p-0"
                        >
                            <option value={20} className="bg-slate-800">20 leads</option>
                            <option value={50} className="bg-slate-800">50 leads</option>
                            <option value={100} className="bg-slate-800">100 leads</option>
                            <option value={500} className="bg-slate-800">500 leads</option>
                        </select>
                    </div>
                </div>

            </div>
        </div>
    );
}
