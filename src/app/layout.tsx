import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { WebsiteSchema, OrganizationSchema } from '@/components/SchemaOrg'

const GA_ID = 'G-0QJYC9011B'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: '7c7YjINgq_4FCFbwseYQAsbgpMp_VBNCL5PfqBu0pYg',
  },
  title: {
    default: `${SITE_NAME} — Find Commercial HVAC Contractors`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ['commercial HVAC', 'HVAC contractor', 'commercial heating and cooling', 'HVAC repair', 'HVAC installation'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Find Commercial HVAC Contractors`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Find Commercial HVAC Contractors`,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://dcxiruohzhbftqwpvhxo.supabase.co" />
        <link rel="preconnect" href="https://dcxiruohzhbftqwpvhxo.supabase.co" />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
        <WebsiteSchema />
        <OrganizationSchema />
        <Navbar />
        <main className="flex-1 min-h-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
