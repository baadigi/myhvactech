import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) return null
  return user
}

// ─── GET /api/admin/claims — List all claim requests ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createAdminClient()
    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status') || 'all'

    let query = db
      .from('claim_requests')
      .select(`
        id,
        created_at,
        updated_at,
        contractor_id,
        user_id,
        contact_name,
        contact_email,
        contact_phone,
        job_title,
        message,
        status,
        admin_notes,
        reviewed_at,
        reviewed_by,
        contractors:contractor_id (
          company_name,
          slug,
          city,
          state,
          is_claimed,
          owner_id
        )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: claims, error } = await query

    if (error) {
      console.error('Admin claims fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ claims: claims || [] })
  } catch (err) {
    console.error('Admin claims route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/claims — Approve or deny a claim ───────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const claimId = (body.claim_id as string)?.trim()
    const action = body.action as string // 'approve' or 'deny'
    const adminNotes = (body.admin_notes as string)?.trim() || null

    if (!claimId) return NextResponse.json({ error: 'Claim ID is required' }, { status: 422 })
    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "deny"' }, { status: 422 })
    }

    const db = createAdminClient()

    // Fetch the claim
    const { data: claim, error: fetchError } = await db
      .from('claim_requests')
      .select('id, contractor_id, user_id, status')
      .eq('id', claimId)
      .single()

    if (fetchError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: `This claim has already been ${claim.status}.` },
        { status: 409 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied'

    // Update the claim
    const { error: updateError } = await db
      .from('claim_requests')
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    if (updateError) {
      console.error('Claim update error:', updateError)
      return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
    }

    // If approved, link the user to the contractor listing
    if (action === 'approve') {
      const { error: contractorError } = await db
        .from('contractors')
        .update({
          owner_id: claim.user_id,
          is_claimed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.contractor_id)

      if (contractorError) {
        console.error('Contractor claim link error:', contractorError)
        // Rollback the claim status
        await db
          .from('claim_requests')
          .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
          .eq('id', claimId)
        return NextResponse.json({ error: 'Failed to link owner to listing' }, { status: 500 })
      }

      // Deny any other pending claims for the same contractor
      await db
        .from('claim_requests')
        .update({
          status: 'denied',
          admin_notes: 'Another claim was approved for this listing.',
          reviewed_at: new Date().toISOString(),
          reviewed_by: admin.email,
        })
        .eq('contractor_id', claim.contractor_id)
        .eq('status', 'pending')
        .neq('id', claimId)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('Admin claims PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
