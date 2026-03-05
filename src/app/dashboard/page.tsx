import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Implement dashboard overview
  // - Stats cards (profile views, leads, reviews, avg rating)
  // - Recent leads list
  // - Recent reviews
  // - Quick actions (edit profile, upload photos)
  // - Subscription status + upgrade CTA

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <p>TODO: Dashboard overview</p>
    </main>
  )
}
