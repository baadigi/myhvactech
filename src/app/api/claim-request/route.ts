import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── POST /api/claim-request — Submit a claim for a contractor listing ───────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to claim a listing.' },
        { status: 401 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const contractorId = (body.contractor_id as string)?.trim()
    const contactName = (body.contact_name as string)?.trim()
    const contactEmail = (body.contact_email as string)?.trim()
    const contactPhone = (body.contact_phone as string)?.trim() || null
    const jobTitle = (body.job_title as string)?.trim() || null
    const message = (body.message as string)?.trim() || null

    if (!contractorId) return NextResponse.json({ error: 'Contractor ID is required' }, { status: 422 })
    if (!contactName) return NextResponse.json({ error: 'Your name is required' }, { status: 422 })
    if (!contactEmail) return NextResponse.json({ error: 'Your email is required' }, { status: 422 })

    const db = createAdminClient()

    // Check that the contractor exists and is not already claimed
    const { data: contractor, error: fetchError } = await db
      .from('contractors')
      .select('id, company_name, is_claimed, owner_id')
      .eq('id', contractorId)
      .single()

    if (fetchError || !contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    if (contractor.is_claimed && contractor.owner_id) {
      return NextResponse.json(
        { error: 'This listing has already been claimed.' },
        { status: 409 }
      )
    }

    // Check if this user already has a pending claim for this contractor
    const { data: existingClaim } = await db
      .from('claim_requests')
      .select('id, status')
      .eq('contractor_id', contractorId)
      .eq('user_id', user.id)
      .single()

    if (existingClaim) {
      if (existingClaim.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending claim for this listing. We\'ll review it shortly.' },
          { status: 409 }
        )
      }
      if (existingClaim.status === 'denied') {
        // Allow re-submission: update the existing record
        const { error: updateError } = await db
          .from('claim_requests')
          .update({
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            job_title: jobTitle,
            message,
            status: 'pending',
            admin_notes: null,
            reviewed_at: null,
            reviewed_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingClaim.id)

        if (updateError) {
          console.error('Claim re-submit error:', updateError)
          return NextResponse.json({ error: 'Failed to resubmit claim' }, { status: 500 })
        }

        return NextResponse.json({ success: true, resubmitted: true })
      }
    }

    // Insert new claim request
    const { error: insertError } = await db
      .from('claim_requests')
      .insert({
        contractor_id: contractorId,
        user_id: user.id,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        job_title: jobTitle,
        message,
      })

    if (insertError) {
      console.error('Claim insert error:', insertError)
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You already have a claim for this listing.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Claim request route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
