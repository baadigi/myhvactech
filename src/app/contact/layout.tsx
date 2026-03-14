import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with My HVAC Tech. Questions about our commercial HVAC contractor marketplace? Reach out and we\'ll respond within 24 hours.',
  alternates: { canonical: `${SITE_URL}/contact` },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
