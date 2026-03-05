import { Metadata } from 'next'
import { SUBSCRIPTION_TIERS, SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Pricing Plans for HVAC Contractors | ${SITE_NAME}`,
  description: 'Choose the right plan for your commercial HVAC business. Start free, upgrade when you are ready.',
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
