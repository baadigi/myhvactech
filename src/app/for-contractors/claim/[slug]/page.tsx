import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_NAME } from '@/lib/constants'
import ClaimListingClient from './ClaimListingClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('company_name, city, state')
    .eq('slug', slug)
    .single()

  if (!contractor) return { title: 'Listing Not Found' }

  return {
    title: `Claim ${contractor.company_name} — ${contractor.city}, ${contractor.state} | ${SITE_NAME}`,
    description: `Claim and manage the listing for ${contractor.company_name} on ${SITE_NAME}. Verify ownership to update your profile, respond to reviews, and receive leads.`,
    robots: { index: false, follow: false }, // Don't index claim pages
  }
}

export default async function ClaimListingPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, company_name, city, state, phone, is_claimed, slug')
    .eq('slug', slug)
    .single()

  if (!contractor) notFound()

  return <ClaimListingClient contractor={contractor} />
}
