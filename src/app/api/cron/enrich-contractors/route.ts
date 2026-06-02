import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Reads each commercial contractor's website, infers its commercial-capability
// fields (system types, building types, 24/7, SLAs, etc.) AND writes the
// landing-page description in ONE Claude call, then saves everything.
// Batched so it stays under the serverless limit; trigger repeatedly to drain.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function validateCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

const SYSTEM_TYPES = ['rtu','vrf','chilled_water','split_system','boiler','heat_pump','ahu','cooling_tower','ptac','geothermal']
const BUILDING_TYPES = ['office','retail','industrial','healthcare','education','hospitality','data_center','multifamily','government','restaurant','mixed_use']
const SERVICE_AGREEMENT_TYPES = ['preventive_maintenance','full_service','parts_labor','emergency_only']

interface Row {
  id: string
  company_name: string
  city: string | null
  state: string | null
  website: string | null
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchSite(url: string | null): Promise<string> {
  if (!url) return ''
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyHVACTechBot/1.0)' } })
    clearTimeout(t)
    if (!res.ok) return ''
    return stripHtml(await res.text()).slice(0, 5000)
  } catch {
    return ''
  }
}

function clampEnum(arr: unknown, allowed: string[]): string[] {
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.filter((v): v is string => typeof v === 'string' && allowed.includes(v)))]
}

async function enrichOne(c: Row, apiKey: string) {
  const siteText = await fetchSite(c.website)

  const system = `You are a commercial HVAC analyst and copywriter for MyHVAC.Tech, a directory for property managers and facility managers (NOT homeowners). You analyze a contractor and return STRICT JSON only — no prose, no markdown fences.`

  const user = `Contractor: ${c.company_name}
Location: ${c.city || 'Unknown'}, ${c.state || 'CA'}
Website content (may be empty):
"""${siteText || '(no website content available)'}"""

Return ONLY this JSON object. Infer fields from the website content; if unknown, use empty array / false / null — DO NOT invent specifics not supported by the content or the company name.

{
  "system_types": [],            // subset of: ${SYSTEM_TYPES.join(', ')}
  "building_types_served": [],   // subset of: ${BUILDING_TYPES.join(', ')}
  "offers_24_7": false,
  "multi_site_coverage": false,
  "offers_service_agreements": false,
  "service_agreement_types": [], // subset of: ${SERVICE_AGREEMENT_TYPES.join(', ')}
  "sla_summary": null,           // one short sentence, or null
  "brands_serviced": [],         // brand names if mentioned (e.g. Carrier, Trane, York)
  "full_description": "",        // 200-350 words, facility-manager angle, weave in city + commercial HVAC + the system/building types above. Open with the most compelling concrete fact.
  "short_description": "",       // 150-160 chars for the card, include city
  "meta_description": ""         // 150-160 chars SEO, include company + city + CTA
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1600,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  let text: string = data.content?.[0]?.text?.trim() || ''
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = text.indexOf('{'); const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  const j = JSON.parse(text.slice(start, end + 1))

  const update = {
    system_types: clampEnum(j.system_types, SYSTEM_TYPES),
    building_types_served: clampEnum(j.building_types_served, BUILDING_TYPES),
    offers_24_7: !!j.offers_24_7,
    multi_site_coverage: !!j.multi_site_coverage,
    offers_service_agreements: !!j.offers_service_agreements,
    service_agreement_types: clampEnum(j.service_agreement_types, SERVICE_AGREEMENT_TYPES),
    sla_summary: typeof j.sla_summary === 'string' && j.sla_summary.trim() ? j.sla_summary.trim().slice(0, 300) : null,
    brands_serviced: Array.isArray(j.brands_serviced) ? j.brands_serviced.filter((b: unknown) => typeof b === 'string').slice(0, 12) : [],
    description: typeof j.full_description === 'string' ? j.full_description.trim() : null,
    short_description: typeof j.short_description === 'string' ? j.short_description.trim().slice(0, 200) : null,
    meta_description: typeof j.meta_description === 'string' ? j.meta_description.trim().slice(0, 200) : null,
    updated_at: new Date().toISOString(),
  }
  return update
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 25)
  const onlyId = searchParams.get('id')

  const db = createAdminClient()

  let query = db
    .from('contractors')
    .select('id, company_name, city, state, website')
    .or(`description.is.null,description.eq.`)

  if (onlyId) {
    query = db.from('contractors').select('id, company_name, city, state, website').eq('id', onlyId)
  } else {
    // commercial only: imported (in candidates) OR commercial-named
    query = query.or(`company_name.ilike.%mechanical%,company_name.ilike.%commercial%,company_name.ilike.%industrial%,company_name.ilike.%systems%,company_name.ilike.%refrigeration%,company_name.ilike.%controls%,company_name.ilike.%sheet metal%,company_name.ilike.%energy%,company_name.ilike.%climate%,company_name.ilike.%thermal%,company_name.ilike.%air balance%,company_name.ilike.%engineering%`)
  }
  query = query.limit(limit)

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const targets = (rows || []) as Row[]
  let updated = 0
  const errors: string[] = []

  for (const c of targets) {
    try {
      const update = await enrichOne(c, apiKey)
      const { error: upErr } = await db.from('contractors').update(update).eq('id', c.id)
      if (upErr) { errors.push(`${c.company_name}: ${upErr.message}`); continue }
      updated++
    } catch (e) {
      errors.push(`${c.company_name}: ${e instanceof Error ? e.message : 'error'}`)
    }
  }

  // remaining commercial listings still missing a description
  const { count: remaining } = await db
    .from('contractors')
    .select('id', { count: 'exact', head: true })
    .or('description.is.null,description.eq.')
    .ilike('company_name', '%mechanical%')

  return NextResponse.json({
    processed: targets.length,
    updated,
    errors: errors.slice(0, 10),
    remaining_mechanical_named: remaining ?? null,
  })
}
