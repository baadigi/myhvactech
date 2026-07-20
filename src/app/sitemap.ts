import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL, HVAC_SERVICES, US_STATES } from '@/lib/constants'
import { TRADE_KEY } from '@/lib/trade-scope'
import { citySlug, stateSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = []

  // Static pages
  routes.push(
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    // /search is intentionally noindex — keep it out of the sitemap.
    { url: `${SITE_URL}/for-contractors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/for-contractors/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/get-quotes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/resources/commercial-hvac-cost-calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/resources/commercial-hvac-contractor-checklist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/resources/commercial-hvac-maintenance-plan`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  )

  // Service pages
  HVAC_SERVICES.forEach(service => {
    routes.push({
      url: `${SITE_URL}/services/${service.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  // State pages
  US_STATES.forEach(state => {
    routes.push({
      url: `${SITE_URL}/${state.name.toLowerCase().replace(/\s+/g, '-')}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  })

  // Dynamic routes from Supabase (only if env vars are set)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Contractor profiles — MUST filter by trade: this Supabase project is
    // shared across every trade directory, so an unscoped query emits other
    // trades' contractor/city URLs that this site 404s on (crawl 2026-07-14:
    // 200+ 404s, 193 4XX-in-sitemap).
    const { data: contractors } = await supabase
      .from('contractors')
      .select('slug, updated_at, city, state')
      .eq('trade', TRADE_KEY)
      .neq('subscription_status', 'cancelled')

    if (contractors) {
      // Individual contractor pages
      contractors.forEach(c => {
        routes.push({
          url: `${SITE_URL}/contractors/${c.slug}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })

      // ── City pages derived from contractors table ──────────────────
      // Group by the SAME (stateSlug, citySlug) the page routes resolve, and
      // fold both state representations ("MO"/"Missouri") into one, mirroring
      // the city page's citySlug match + state.ilike gate. Only sitemap a city
      // once it clears the page's 3-contractor noindex gate — otherwise we list
      // pages the page then noindexes ("noindex page in sitemap").
      const cityCount = new Map<string, number>()
      const cityMeta = new Map<string, { city: string; state: string }>()

      for (const c of contractors) {
        if (!c.city || !c.state) continue
        const stateObj = US_STATES.find(
          s => s.abbr.toLowerCase() === c.state.toLowerCase() || s.name.toLowerCase() === c.state.toLowerCase()
        )
        if (!stateObj) continue
        const key = `${stateSlug(stateObj.name)}|${citySlug(c.city)}`
        cityCount.set(key, (cityCount.get(key) || 0) + 1)
        if (!cityMeta.has(key)) cityMeta.set(key, { city: citySlug(c.city), state: stateSlug(stateObj.name) })
      }

      for (const [key, { city, state }] of cityMeta) {
        if ((cityCount.get(key) || 0) < 3) continue

        routes.push({
          url: `${SITE_URL}/${state}/${city}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
        HVAC_SERVICES.forEach(service => {
          routes.push({
            url: `${SITE_URL}/${state}/${city}/${service.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.65,
          })
        })
      }
    }

    // Blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('trade', TRADE_KEY)
      .eq('status', 'published')
      .not('published_at', 'is', null)

    if (blogPosts) {
      // Blog index page
      routes.push({
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })

      // Individual blog posts
      blogPosts.forEach(post => {
        routes.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at || post.published_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }
  }

  // Dedupe by URL — slug normalization (e.g. "St. Louis" vs "St Louis") can emit
  // the same URL twice, which surfaces as "page in multiple sitemaps" once Next
  // splits the sitemap into chunks. Keep the first entry for each URL.
  return Array.from(new Map(routes.map(r => [r.url, r])).values())
}
