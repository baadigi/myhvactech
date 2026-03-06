import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl
  const status = url.searchParams.get('status') || 'all'
  const search = url.searchParams.get('search') || ''
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const db = createAdminClient()

  // Build query — fetch leads with contractor info
  let query: ReturnType<typeof db.from> extends infer T ? any : any
  query = db
    .from('leads')
    .select(`
      *,
      contractor:contractors!contractor_id(id, company_name, slug, city, state)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Status filter
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Search filter (name, email, company)
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`)
  }

  const { data: leads, error, count } = await query

  if (error) {
    console.error('Admin leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  // Get summary counts
  const { data: countData } = await db
    .from('leads')
    .select('status')

  const counts = {
    all: countData?.length ?? 0,
    new: countData?.filter((l: { status: string }) => l.status === 'new').length ?? 0,
    sent: countData?.filter((l: { status: string }) => l.status === 'sent').length ?? 0,
    viewed: countData?.filter((l: { status: string }) => l.status === 'viewed').length ?? 0,
    responded: countData?.filter((l: { status: string }) => l.status === 'responded').length ?? 0,
    closed: countData?.filter((l: { status: string }) => l.status === 'closed').length ?? 0,
  }

  return NextResponse.json({
    leads: leads ?? [],
    total: count ?? 0,
    page,
    limit,
    counts,
  })
}

// Update lead status
export async function PATCH(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, status, notes } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const db = createAdminClient()

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'viewed') updatePayload.viewed_at = new Date().toISOString()
  if (status === 'responded') updatePayload.responded_at = new Date().toISOString()

  const { error } = await db
    .from('leads')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('Admin lead update error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
