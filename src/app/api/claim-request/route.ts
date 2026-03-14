import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/email'

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

    await sendNotification({
      subject: `[My HVAC Tech] New Claim Request: ${contactName} for ${contractor.company_name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Listing Claim Request</h1>
            <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech &middot; ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
              <span style="font-size: 14px; font-weight: 700; color: #0369a1;">Claiming: ${contractor.company_name}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #737373; width: 130px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${contactName}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${contactEmail}" style="color: #0284c7;">${contactEmail}</a></td></tr>
              ${contactPhone ? `<tr><td style="padding: 8px 0; color: #737373;">Phone</td><td style="padding: 8px 0;">${contactPhone}</td></tr>` : ''}
              ${jobTitle ? `<tr><td style="padding: 8px 0; color: #737373;">Title</td><td style="padding: 8px 0;">${jobTitle}</td></tr>` : ''}
            </table>
            ${message ? `<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" /><p style="font-size: 13px; color: #737373; margin-bottom: 4px;">Message:</p><p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${message}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <a href="https://myhvac.tech/admin/claims" style="display: inline-block; background: #171717; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">Review in Admin Panel</a>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Claim request route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
