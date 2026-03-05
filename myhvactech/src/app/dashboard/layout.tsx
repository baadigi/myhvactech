import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Add sidebar navigation
  // - Overview
  // - Edit Profile
  // - Photos
  // - Reviews
  // - Leads
  // - Messages
  // - Analytics
  // - Billing

  return (
    <div className="flex min-h-screen">
      <aside>
        {/* TODO: Sidebar */}
      </aside>
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
