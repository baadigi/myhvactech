import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Free Quotes from Vetted Commercial HVAC Contractors | My HVAC Tech',
  description:
    'Describe your property and HVAC needs. We\'ll match you with 2-3 vetted commercial contractors in your area. Free for property and facility managers.',
  openGraph: {
    title: 'Get Free Quotes from Vetted Commercial HVAC Contractors',
    description:
      'Describe your property and HVAC needs. We\'ll match you with 2-3 vetted commercial contractors in your area. Free for property and facility managers.',
  },
}

export default function GetQuotesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
