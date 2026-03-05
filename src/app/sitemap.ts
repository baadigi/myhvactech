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
      .select('slug, updated_at')
      .neq('subscription_status', 'cancelled')

    if (contractors) {
      contractors.forEach(c => {
        routes.push({
          url: `${SITE_URL}/contractors/${c.slug}`,
          lastModified: new Date(c.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })
    }

    // City pages from service_areas
    const { data: serviceAreas } = await supabase
      .from('service_areas')
      .select('city, state, state_abbr')

    if (serviceAreas) {
      serviceAreas.forEach(area => {
        const stateSlug = area.state.toLowerCase().replace(/\s+/g, '-')
        const citySlug = area.city.toLowerCase().replace(/\s+/g, '-')

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
      })
    }
  }

  return routes
}
