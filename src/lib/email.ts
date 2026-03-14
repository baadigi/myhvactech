import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'My HVAC Tech <notifications@myhvac.tech>'
const NOTIFY_EMAIL = 'ryan@baadigi.com'

export async function sendNotification({
  subject,
  html,
}: {
  subject: string
  html: string
}) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject,
      html,
    })
    if (error) {
      console.error('Resend error:', error)
    }
  } catch (err) {
    console.error('Email send failed:', err)
  }
}
