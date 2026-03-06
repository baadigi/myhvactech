import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = createAdminClient()
    const { data: contractor, error } = await db
      .from('contractors')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    return NextResponse.json({ contractor })
  } catch (err) {
    console.error('Admin GET contractor error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
