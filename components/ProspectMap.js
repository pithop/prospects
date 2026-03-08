import React, { useState, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Globe, Phone, ExternalLink, Star } from 'lucide-react';

const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function ProspectMap({ prospects = [] }) {
    const [popupInfo, setPopupInfo] = useState(null);
    const [viewState, setViewState] = useState({
        longitude: 2.3522, // Default to Paris
        latitude: 48.8566,
        zoom: 11
    });

    // Automatically adjust bounds to fit all prospects when they change
    useEffect(() => {
        const validProspects = prospects.filter(p => p.latitude && p.longitude);

        if (validProspects.length > 0) {
            // Very basic centering arithmetic. For production, consider using WebMercatorViewport or turf.js bbox
            const avgLat = validProspects.reduce((sum, p) => sum + p.latitude, 0) / validProspects.length;
            const avgLng = validProspects.reduce((sum, p) => sum + p.longitude, 0) / validProspects.length;

            setViewState({
                longitude: avgLng,
                latitude: avgLat,
                zoom: validProspects.length === 1 ? 14 : 11
            });
        }
    }, [prospects]);

    const markers = useMemo(() => {
        return prospects.map((prospect) => {
            // Must have coordinates to display
            if (!prospect.latitude || !prospect.longitude) return null;

            const isHotLead = prospect.status === 'nouveau' && !prospect.has_website && prospect.rating >= 4.5;
            const pinColor = isHotLead ? '#ef4444' : '#3b82f6'; // Red for hot leads, blue otherwise

            return (
                <Marker
                    key={`marker-${prospect.id}`}
                    longitude={prospect.longitude}
                    latitude={prospect.latitude}
                    anchor="bottom"
                    onClick={e => {
                        e.originalEvent.stopPropagation();
                        setPopupInfo(prospect);
                    }}
                >
                    <div className="relative group cursor-pointer transform hover:scale-125 transition-transform duration-200">
                        <MapPin
                            className="w-10 h-10 drop-shadow-lg"
                            style={{ color: pinColor, fill: `${pinColor}40` }} // 25% opacity fill
                        />
                        {isHotLead && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                </Marker>
            );
        });
    }, [prospects]);

    return (
        <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={CARTO_DARK_MATTER}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {markers}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={Number(popupInfo.longitude)}
                        latitude={Number(popupInfo.latitude)}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        className="prospect-popup"
                        maxWidth="300px"
                    >
                        <div className="bg-[#0b1120] border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-4">
                                <h3 className="text-white font-bold text-lg leading-tight">{popupInfo.name}</h3>
                                <button
                                    onClick={() => setPopupInfo(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <span className="flex items-center gap-1 text-yellow-500 font-semibold bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                    <Star className="w-3 h-3 fill-current" />
                                    {popupInfo.rating} <span className="text-gray-400 font-normal">({popupInfo.reviews})</span>
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="truncate">{popupInfo.category}</span>
                            </div>

                            <div className="space-y-2 mt-2">
                                {popupInfo.address && (
                                    <p className="text-sm text-gray-400 flex items-start gap-2">
                                        <MapPin className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                                        <span className="line-clamp-2">{popupInfo.address}</span>
                                    </p>
                                )}
                                {popupInfo.phone && (
                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-green-400 shrink-0" />
                                        {popupInfo.phone}
                                    </p>
                                )}
                            </div>

                            <div className="mt-2 pt-3 border-t border-white/10 flex justify-between items-center">
                                {!popupInfo.has_website ? (
                                    <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded border border-red-500/20">
                                        No Website
                                    </span>
                                ) : (
                                    <a href={popupInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                        <Globe className="w-3 h-3" /> Visit Site
                                    </a>
                                )}

                                {popupInfo.google_maps_url && (
                                    <a
                                        href={popupInfo.google_maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
                                    >
                                        View Map <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Global styles for overriding Mapbox/Maplibre default popup styles to match the dark theme */}
            <style jsx global>{`
        .prospect-popup .maplibregl-popup-content {
          background: transparent;
          padding: 0;
          box-shadow: none;
        }
        .prospect-popup .maplibregl-popup-tip {
          border-bottom-color: #0b1120;
          border-top-color: #0b1120;
        }
      `}</style>
        </div>
    );
}
