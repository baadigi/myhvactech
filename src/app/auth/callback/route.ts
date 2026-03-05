import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the intended destination after successful auth
      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : next
      return NextResponse.redirect(redirectUrl)
    }

    // If there was an error exchanging the code, redirect to login with error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  // No code present — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
