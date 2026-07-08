// GET /api/geo — visitor location + current weather for the Scope Agent's
// proactive greeting. Location comes free from Vercel's IP-geo headers;
// weather from Open-Meteo (keyless). Returns nulls when unknown — the widget
// falls back to a generic greeting, never fabricated data.
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ponytail: coarse buckets are all the greeting needs
const CONDITIONS: [number, string][] = [
  [0, 'clear'], [1, 'mostly sunny'], [2, 'partly cloudy'], [3, 'overcast'],
  [48, 'foggy'], [57, 'drizzly'], [67, 'rainy'], [77, 'snowy'],
  [82, 'rainy'], [86, 'snowy'], [99, 'stormy'],
]
const condition = (code: number) => CONDITIONS.find(([max]) => code <= max)?.[1] ?? null

export async function GET(request: NextRequest) {
  const h = request.headers
  const city = h.get('x-vercel-ip-city')
  const region = h.get('x-vercel-ip-country-region')
  const lat = h.get('x-vercel-ip-latitude')
  const lon = h.get('x-vercel-ip-longitude')

  let weather: { tempF: number; condition: string | null } | null = null
  if (lat && lon) {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
        { signal: AbortSignal.timeout(2500) }
      )
      if (res.ok) {
        const d = await res.json()
        if (typeof d?.current?.temperature_2m === 'number') {
          weather = { tempF: Math.round(d.current.temperature_2m), condition: condition(d.current.weather_code ?? -1) }
        }
      }
    } catch { /* greeting degrades gracefully without weather */ }
  }

  return Response.json(
    { city: city ? decodeURIComponent(city) : null, region: region || null, weather },
    { headers: { 'Cache-Control': 'private, max-age=600' } }
  )
}
