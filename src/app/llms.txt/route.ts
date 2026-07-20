import { createClient } from '@supabase/supabase-js'
import { SITE_URL, HVAC_SERVICES, US_STATES } from '@/lib/constants'
import { TRADE_KEY } from '@/lib/trade-scope'
import { citySlug, stateSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // refresh daily

// llms.txt — a curated map for AI crawlers (ChatGPT, Perplexity, Claude, etc.).
// A guide, not an exhaustive index: services + top cities as direct anchors,
// then a pointer to sitemap.xml for the full 5k-page set. Cities respect the
// SAME 3-contractor gate the sitemap/pages use, so we never point AI at a
// noindexed page.
export async function GET() {
  const lines: string[] = [
    '# My HVAC Tech',
    '',
    '> The national directory of commercial HVAC contractors. Compare vetted commercial HVAC companies by city and service — repair, installation, maintenance, RTUs, chillers, boilers, and emergency service. Every listing includes a plain-English overview, quick answers, and FAQs.',
    '',
    '## Key Pages',
    `- [Find a commercial HVAC contractor](${SITE_URL}/): Search vetted commercial HVAC companies by location and service.`,
    `- [All services](${SITE_URL}/services): The 20 commercial HVAC services covered across the directory.`,
    `- [Get quotes](${SITE_URL}/get-quotes): Request quotes from commercial HVAC contractors.`,
    `- [For contractors](${SITE_URL}/for-contractors): How commercial HVAC companies get listed.`,
    `- [Resources](${SITE_URL}/resources): Cost calculator, contractor checklist, and maintenance-plan guides.`,
    `- [Blog](${SITE_URL}/blog): Commercial HVAC guides and buying advice.`,
    '',
    '## Services',
    ...HVAC_SERVICES.map(
      s => `- [${s.name}](${SITE_URL}/services/${s.slug})`
    ),
    '',
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: contractors } = await supabase
      .from('contractors')
      .select('city, state')
      .eq('trade', TRADE_KEY)
      .neq('subscription_status', 'cancelled')

    if (contractors) {
      // Same (stateSlug|citySlug) fold + 3-contractor gate as sitemap.ts.
      const count = new Map<string, number>()
      const meta = new Map<string, { city: string; state: string; label: string }>()
      for (const c of contractors) {
        if (!c.city || !c.state) continue
        const st = US_STATES.find(
          s => s.abbr.toLowerCase() === c.state.toLowerCase() || s.name.toLowerCase() === c.state.toLowerCase()
        )
        if (!st) continue
        const key = `${stateSlug(st.name)}|${citySlug(c.city)}`
        count.set(key, (count.get(key) || 0) + 1)
        if (!meta.has(key)) meta.set(key, { city: citySlug(c.city), state: stateSlug(st.name), label: `${c.city}, ${st.abbr}` })
      }

      const cities = [...meta.entries()]
        .filter(([k]) => (count.get(k) || 0) >= 3)
        .sort((a, b) => (count.get(b[0]) || 0) - (count.get(a[0]) || 0))
        .slice(0, 50)

      if (cities.length) {
        lines.push('## Top Cities')
        for (const [, m] of cities) {
          lines.push(`- [Commercial HVAC contractors in ${m.label}](${SITE_URL}/${m.state}/${m.city})`)
        }
        lines.push('')
      }
    }
  }

  lines.push('## Full Index')
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml): Every indexed city, service, and contractor page.`)
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
