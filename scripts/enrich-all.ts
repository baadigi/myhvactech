// Bulk listing enrichment for ALL hvac contractors → National LLM-SEO
// (Quick Answers + About body + FAQ), written to LIVE columns.
// Resumable: only processes rows where qa_snippets IS NULL. Concurrency-limited.
//
// Run (source the pulled Vercel env for keys):
//   set -a && . ./.vercel/.env.preview.local && set +a
//   npx tsx scripts/enrich-all.ts 2>&1 | tee /tmp/enrich-hvac.log
import { createClient } from '@supabase/supabase-js'
import { fetchWebsiteContent, generateListingContent, generateFallback, type ContractorRow } from '../src/lib/listing-content'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const CONCURRENCY = 14
const TRADE = 'hvac'

const COLS =
  'id,slug,company_name,city,state,year_established,system_types,building_types_served,brands_serviced,' +
  'emergency_response_minutes,offers_24_7,multi_site_coverage,max_sites_supported,num_technicians,num_nate_certified,' +
  'years_commercial_experience,offers_service_agreements,service_agreement_types,sla_summary,google_rating,' +
  'google_review_count,google_editorial_summary,google_formatted_address,google_phone,google_website,website,' +
  'google_reviews,tonnage_range_min,tonnage_range_max,service_radius_miles,license_number,insurance_verified,' +
  'uses_gps_tracking,dispatch_crm'

type Row = ContractorRow & { id: string; slug: string; website?: string | null }

async function fetchPending(limit: number): Promise<Row[]> {
  const { data, error } = await db
    .from('contractors')
    .select(COLS)
    .eq('trade', TRADE)
    .is('qa_snippets', null)
    .neq('subscription_status', 'cancelled')
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Row[]
}

async function enrichOne(c: Row): Promise<'ok' | 'fallback' | 'error'> {
  try {
    const url = c.website || c.google_website || null
    const site = url ? await fetchWebsiteContent(url) : null
    let update: Record<string, unknown>
    try {
      const gen = await generateListingContent(c, site)
      update = {
        description: gen.description,
        short_description: gen.short || null,
        meta_description: gen.meta || null,
        qa_snippets: gen.qa,
        faq: gen.faq,
      }
    } catch {
      // Anti-fab fallback: plain grounded prose, empty qa/faq so it's retried next run.
      update = { description: generateFallback(c) }
      const { error } = await db.from('contractors').update(update).eq('id', c.id)
      return error ? 'error' : 'fallback'
    }
    const { error } = await db.from('contractors').update(update).eq('id', c.id)
    return error ? 'error' : 'ok'
  } catch {
    return 'error'
  }
}

async function main() {
  const BATCH = 300
  const attempted = new Set<string>()
  let done = 0, ok = 0, fb = 0, err = 0
  for (;;) {
    const fetched = await fetchPending(BATCH)
    // Skip rows already tried this run (fallback/error rows keep qa_snippets null,
    // so they'd otherwise be re-fetched forever). Re-run the script to retry them.
    const rows = fetched.filter((r) => !attempted.has(r.id))
    if (!rows.length) break
    rows.forEach((r) => attempted.add(r.id))
    // Simple concurrency pool.
    let idx = 0
    async function worker() {
      while (idx < rows.length) {
        const c = rows[idx++]
        const r = await enrichOne(c)
        done++
        if (r === 'ok') ok++; else if (r === 'fallback') fb++; else err++
        if (done % 25 === 0) console.log(`… ${done} done (ok ${ok}, fallback ${fb}, err ${err})`)
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    console.log(`batch complete — total ${done} (ok ${ok}, fallback ${fb}, err ${err})`)
  }
  console.log(`DONE — ${done} processed (ok ${ok}, fallback ${fb}, err ${err})`)
}

main().then(() => process.exit(0))
