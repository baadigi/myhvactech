import { Metadata } from 'next'
import { SUBSCRIPTION_TIERS, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Pricing Plans for HVAC Contractors',
  description: 'Choose the right plan for your commercial HVAC business. Start free, upgrade when you are ready.',
  alternates: { canonical: `${SITE_URL}/for-contractors/pricing` },
}

export default function PricingPage() {
  // TODO: Render pricing comparison table
  // - Free / Bronze / Silver / Gold tiers
  // - Feature comparison
  // - Monthly / Annual toggle (save 20%)
  // - CTA buttons to Stripe Checkout

  return (
    <main>
      <h1>Simple, Transparent Pricing</h1>
      <p>TODO: Pricing table with all tiers</p>
    </main>
  )
}
