import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'
import { fetchWebsiteContent, generateListingContent, type ContractorRow } from '@/lib/listing-content'

// Drains listings that still lack National LLM-SEO content (Quick Answers + FAQ) —
// e.g. newly-scraped rows. Small batch per run to stay under the serverless limit;
// scheduled daily and idempotent (only touches rows where qa_snippets IS NULL).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const BATCH = 12

function validateCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('contractors')
    .select('*')
    .eq('trade', TRADE_KEY)
    .is('qa_snippets', null)
    .neq('subscription_status', 'cancelled')
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .limit(BATCH)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []) as unknown as (ContractorRow & { id: string })[]
  if (!rows.length) return NextResponse.json({ message: 'nothing pending', processed: 0 })

  let ok = 0, failed = 0
  for (const c of rows) {
    try {
      const url = c.google_website || (c as { website?: string | null }).website || null
      const site = url ? await fetchWebsiteContent(url) : null
      const gen = await generateListingContent(c, site)
      const { error: upErr } = await db
        .from('contractors')
        .update({
          description: gen.description,
          short_description: gen.short || null,
          meta_description: gen.meta || null,
          qa_snippets: gen.qa,
          faq: gen.faq,
        })
        .eq('id', c.id)
      if (upErr) failed++; else ok++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed: rows.length, ok, failed })
}
