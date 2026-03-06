import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NOTIFY_EMAIL = 'ryan@baadigi.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, company, reason, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // Store in Supabase (contact_messages table — will create if running migration)
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || null,
      reason: reason || 'general',
      message: message.trim(),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    })

    if (dbError) {
      console.error('Contact message insert error:', dbError)
      // Don't fail the request — still send the email notification
    }

    // Send email notification to admin
    await sendNotificationEmail({
      type: 'contact',
      name: name.trim(),
      email: email.trim(),
      company: company?.trim() || 'Not provided',
      reason: reason || 'general',
      message: message.trim(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendNotificationEmail(data: {
  type: string
  name: string
  email: string
  company: string
  reason: string
  message: string
}) {
  // Use Supabase Edge Function or direct SMTP
  // For now, use the Supabase built-in auth.admin to trigger an email
  // Fallback: log to console + store in DB (already done above)
  console.log(`[CONTACT NOTIFICATION] New ${data.type} from ${data.name} <${data.email}>`)
  console.log(`  Company: ${data.company}`)
  console.log(`  Reason: ${data.reason}`)
  console.log(`  Message: ${data.message.substring(0, 200)}...`)

  // Attempt to send via Supabase Edge Function if available
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: NOTIFY_EMAIL,
          subject: `[My HVAC Tech] New Contact: ${data.reason} from ${data.name}`,
          html: buildContactEmailHtml(data),
        }),
      }).catch(() => {
        // Edge function may not exist yet — that's OK, we logged and stored in DB
      })
    }
  } catch {
    // Silently fail — the message is stored in the database
  }
}

function buildContactEmailHtml(data: {
  name: string
  email: string
  company: string
  reason: string
  message: string
}) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Contact Message</h1>
        <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech</p>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #737373; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${data.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #0284c7;">${data.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #737373;">Company</td><td style="padding: 8px 0;">${data.company}</td></tr>
          <tr><td style="padding: 8px 0; color: #737373;">Reason</td><td style="padding: 8px 0;">${data.reason}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
        <p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
        <p style="font-size: 12px; color: #a3a3a3;">Reply directly to <a href="mailto:${data.email}" style="color: #0284c7;">${data.email}</a></p>
      </div>
    </div>
  `
}
