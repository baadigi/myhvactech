import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ContactContractorPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, company_name, city, state, services:contractor_services(services(*))')
    .eq('slug', slug)
    .single()

  if (!contractor) notFound()

  // TODO: Render lead capture form
  // Fields: name, email, phone, company, service_needed, message, urgency, preferred_contact
  // On submit: POST /api/leads
  return (
    <main>
      <h1>Contact {contractor.company_name}</h1>
      <p>TODO: Lead capture form</p>
    </main>
  )
}
