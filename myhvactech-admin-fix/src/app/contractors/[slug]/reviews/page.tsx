import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ContractorReviewsPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, company_name, city, state, avg_rating, review_count')
    .eq('slug', slug)
    .single()

  if (!contractor) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('contractor_id', contractor.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // TODO: Render paginated reviews list with rating breakdown
  return (
    <main>
      <h1>Reviews for {contractor.company_name}</h1>
      <p>{contractor.avg_rating} avg · {contractor.review_count} reviews</p>
    </main>
  )
}
