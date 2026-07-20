import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

// Next.js does NOT merge openGraph fields from parent metadata — any page that
// sets its own `openGraph` loses og:url / og:image / og:type unless it repeats
// them. This returns a COMPLETE object so no page trips Ahrefs' "Open Graph tags
// incomplete". og:image defaults to the dynamic per-tenant /opengraph-image.
export function buildOpenGraph(opts: {
  title: string
  description: string
  path?: string // leading-slash path (e.g. "/florida/miami"); omit for home
  image?: string
}): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}${opts.path ?? ''}`,
    title: opts.title,
    description: opts.description,
    images: [opts.image ?? `${SITE_URL}/opengraph-image`],
  }
}
