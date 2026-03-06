import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL, HVAC_SERVICES, US_STATES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = []

  // Static pages
  routes.push(
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/for-contractors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/for-contractors/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/get-quotes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
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

    // Contractor profiles
    const { data: contractors } = await supabase
      .from('contractors')
      .select('slug, updated_at, city, state')
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
      // Build unique city/state combinations from actual contractor data
      const cityStateMap = new Map<string, { city: string; stateAbbr: string }>()

      for (const c of contractors) {
        if (c.city && c.state) {
          const key = `${c.city.toLowerCase()}|${c.state.toLowerCase()}`
          if (!cityStateMap.has(key)) {
            cityStateMap.set(key, { city: c.city, stateAbbr: c.state })
          }
        }
      }

      for (const { city, stateAbbr } of cityStateMap.values()) {
        // Find the full state name to build the state slug
        const stateObj = US_STATES.find(
          s => s.abbr.toLowerCase() === stateAbbr.toLowerCase()
        )
        if (!stateObj) continue

        const stateSlug = stateObj.name.toLowerCase().replace(/\s+/g, '-')
        const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        // City page
        routes.push({
          url: `${SITE_URL}/${stateSlug}/${citySlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })

        // City + service pages
        HVAC_SERVICES.forEach(service => {
          routes.push({
            url: `${SITE_URL}/${stateSlug}/${citySlug}/${service.slug}`,
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

  return routes
}
