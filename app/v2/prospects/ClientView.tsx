"use client"

import React, { useState } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, ExternalLink, Phone, Zap } from 'lucide-react'

// Using a dark theme basemap to match the application aesthetic
const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

type ProspectV2 = {
  uber_store_uuid: string
  restaurant_name: string
  category: string
  city: string
  address: string
  phone_number: string
  uber_eats_url: string
  website_url_found: string
  latitude: number | null
  longitude: number | null
  audit_status: string
}

interface ClientViewProps {
  initialProspects: ProspectV2[]
}

export default function ClientView({ initialProspects }: ClientViewProps) {
  // Center roughly on Montpellier
  const [viewState, setViewState] = useState({
    longitude: 3.8767,
    latitude: 43.6108,
    zoom: 12
  })
  const [selectedProspect, setSelectedProspect] = useState<ProspectV2 | null>(null)

  const handleGenerateAudit = (prospect: ProspectV2) => {
    console.log("Générer Audit IA pour :", prospect.restaurant_name)
    alert(`Génération de l'audit pour ${prospect.restaurant_name} lancée (voir console)`)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Map Section */}
      <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={CARTO_DARK_MATTER}
        >
          <NavigationControl position="top-right" />
          
          {initialProspects.map((p) => {
            if (!p.latitude || !p.longitude) return null
            
            return (
              <Marker
                key={p.uber_store_uuid}
                longitude={p.longitude}
                latitude={p.latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation()
                  setSelectedProspect(p)
                }}
              >
                <div className="relative group cursor-pointer transform hover:scale-125 transition-transform duration-200">
                  <MapPin className="w-8 h-8 text-orange-500 drop-shadow-lg" fill="#f9731640" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                </div>
              </Marker>
            )
          })}
        </Map>
      </div>

      {/* Data Table Section */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Restaurant</th>
                <th className="px-6 py-4 font-semibold">Contact & Adresse</th>
                <th className="px-6 py-4 font-semibold">Présence Web</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {initialProspects.map((p) => (
                <tr 
                  key={p.uber_store_uuid} 
                  className={`hover:bg-slate-700/30 transition-colors ${selectedProspect?.uber_store_uuid === p.uber_store_uuid ? 'bg-slate-700/50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-base">{p.restaurant_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.category}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-orange-400/10 px-2 py-1 text-[10px] font-medium text-orange-400 uppercase tracking-wider border border-orange-400/20">
                      🛵 UberEats
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 truncate max-w-xs">{p.address}</div>
                    {p.phone_number && (
                      <div className="flex items-center gap-2 mt-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs">{p.phone_number}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <a 
                        href={p.uber_eats_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Lien UberEats
                      </a>
                      {p.website_url_found && (
                        <a 
                          href={p.website_url_found} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {new URL(p.website_url_found).hostname}
                        </a>
                      )}
                      {!p.website_url_found && (
                        <span className="text-xs text-slate-500 italic">Aucun lien trouvé</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleGenerateAudit(p)}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-500/20"
                    >
                      <Zap className="h-4 w-4" />
                      Générer Audit IA
                    </button>
                  </td>
                </tr>
              ))}
              {initialProspects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Aucun prospect trouvé. Veuillez exécuter le script de scraping.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
