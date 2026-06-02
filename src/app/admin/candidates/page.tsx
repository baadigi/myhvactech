import { createAdminClient } from '@/lib/supabase/admin'
import CandidatesClient, { Candidate } from './CandidatesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Contractor Candidates — Admin' }

export default async function CandidatesPage() {
  const db = createAdminClient()

  const { data: candidates } = await db
    .from('contractor_candidates')
    .select('id, name, city, state, phone, email, contact_name, website, source, needs_website, status')
    .eq('status', 'pending')
    .order('city', { ascending: true })
    .order('name', { ascending: true })

  const list = (candidates || []) as Candidate[]

  const { count: approved } = await db
    .from('contractor_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
  const { count: rejected } = await db
    .from('contractor_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rejected')

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Contractor Candidates</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Imported commercial HVAC shops (union &amp; MCA directories) awaiting review. Approve to publish
          into the directory, or reject to discard. Shops marked <span className="font-medium text-amber-600">Needs site</span> are
          BaaDigi website-sales leads.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
        <Stat label="Pending" value={list.length} tone="neutral" />
        <Stat label="Approved" value={approved ?? 0} tone="green" />
        <Stat label="Rejected" value={rejected ?? 0} tone="red" />
      </div>

      <CandidatesClient initial={list} />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'green' | 'red' }) {
  const colors = {
    neutral: 'bg-white border-neutral-200 text-neutral-900',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }[tone]
  return (
    <div className={`rounded-lg border px-4 py-3 ${colors}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
    </div>
  )
}
