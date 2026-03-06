import JsonLd from '@/components/JsonLd'
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/constants'

export function WebsiteSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <JsonLd data={data} />
}

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@myhvac.tech',
      contactType: 'customer service',
    },
    sameAs: [],
    description: SITE_DESCRIPTION,
  }
  return <JsonLd data={data} />
}

interface LocalBusinessProps {
  name: string
  description?: string
  slug: string
  street?: string
  city?: string
  state?: string
  zip?: string
  telephone?: string
  email?: string
  avg_rating?: number
  review_count?: number
  areaServed?: string
  priceRange?: string
  logo_url?: string
}

export function LocalBusinessSchema(props: LocalBusinessProps) {
  const {
    name,
    description,
    slug,
    street,
    city,
    state,
    zip,
    telephone,
    email,
    avg_rating,
    review_count,
    areaServed,
    priceRange,
    logo_url,
  } = props

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    name,
    ...(description && { description }),
    url: `${SITE_URL}/contractors/${slug}`,
    address: {
      '@type': 'PostalAddress',
      ...(street && { streetAddress: street }),
      ...(city && { addressLocality: city }),
      ...(state && { addressRegion: state }),
      ...(zip && { postalCode: zip }),
    },
    ...(telephone && { telephone }),
    ...(email && { email }),
    ...(avg_rating && avg_rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avg_rating,
        reviewCount: review_count ?? 0,
      },
    }),
    ...(areaServed && { areaServed }),
    ...(priceRange && { priceRange }),
    ...(logo_url && { image: logo_url }),
  }

  return <JsonLd data={data} />
}

interface BlogPostProps {
  headline: string
  excerpt?: string
  datePublished: string
  dateModified?: string
  url: string
  cover_image_url?: string
}

export function BlogPostSchema(props: BlogPostProps) {
  const { headline, excerpt, datePublished, dateModified, url, cover_image_url } = props
  const logo = `${SITE_URL}/logo.png`

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    ...(excerpt && { description: excerpt }),
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(cover_image_url && { image: cover_image_url }),
  }

  return <JsonLd data={data} />
}

interface ServiceProps {
  name: string
  description?: string
  slug: string
}

export function ServiceSchema(props: ServiceProps) {
  const { name, description } = props

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    ...(description && { description }),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    serviceType: 'Commercial HVAC',
  }

  return <JsonLd data={data} />
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={data} />
}

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
}

export function FAQSchema({ items }: FAQProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}
