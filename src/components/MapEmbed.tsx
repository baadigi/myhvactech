'use client'

import { useEffect, useRef } from 'react'

interface MapEmbedProps {
  lat: number
  lng: number
  label?: string
  height?: number
}

export default function MapEmbed({ lat, lng, label, height = 260 }: MapEmbedProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return

      // Inject Leaflet CSS if not already present
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: true,
      }).setView([lat, lng], 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#e11d48"/><circle cx="12" cy="11" r="4" fill="white"/></svg>`,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)
      if (label) marker.bindPopup(label)

      mapInstanceRef.current = map
    })

    return () => {
      cancelled = true
    }
  }, [lat, lng, label])

  return <div ref={mapRef} style={{ width: '100%', height }} />
}
