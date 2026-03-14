import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/email'

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
    }

    await sendNotification({
      subject: `[My HVAC Tech] New Contact: ${reason || 'general'} from ${name.trim()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Contact Message</h1>
            <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech</p>
          </div>
          <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #737373; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name.trim()}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email.trim()}" style="color: #0284c7;">${email.trim()}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Company</td><td style="padding: 8px 0;">${company?.trim() || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Reason</td><td style="padding: 8px 0;">${reason || 'general'}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="font-size: 12px; color: #a3a3a3;">Reply directly to <a href="mailto:${email.trim()}" style="color: #0284c7;">${email.trim()}</a></p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
