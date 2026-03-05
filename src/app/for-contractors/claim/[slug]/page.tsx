import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClaimListingPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, company_name, city, state, phone, is_claimed')
    .eq('slug', slug)
    .single()

  if (!contractor) notFound()

  if (contractor.is_claimed) {
    return (
      <main>
        <h1>Listing Already Claimed</h1>
        <p>This listing for {contractor.company_name} has already been claimed. If you believe this is an error, please contact us.</p>
      </main>
    )
  }

  // TODO: Implement claim flow
  // Step 1: Verify ownership (call to listed phone, postcard, or document upload)
  // Step 2: Create/sign in to account
  // Step 3: Upsell to paid tier

  return (
    <main>
      <h1>Claim Your Listing</h1>
      <p>Claim the listing for {contractor.company_name} in {contractor.city}, {contractor.state}</p>
      <p>TODO: Claim flow steps</p>
    </main>
  )
}
