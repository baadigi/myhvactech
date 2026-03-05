import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      // Route based on verification type
      let redirectPath = next

      if (type === 'recovery') {
        // Password reset — send to update password page
        redirectPath = '/dashboard/profile?reset=true'
      } else if (type === 'signup') {
        // Email confirmation — send to dashboard
        redirectPath = '/dashboard'
      } else if (type === 'email_change') {
        // Email change confirmed — send to profile
        redirectPath = '/dashboard/profile'
      }

      const redirectUrl = redirectPath.startsWith('/') ? `${origin}${redirectPath}` : redirectPath
      return NextResponse.redirect(redirectUrl)
    }

    // Verification failed — redirect with error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Verification link is invalid or has expired. Please try again.')}`
    )
  }

  // Missing token or type — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
