import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // TODO: Verify user is an admin (check admin role in auth.users metadata)
  // Use service role key for admin auth check

  return (
    <div className="flex min-h-screen">
      <aside>
        {/* TODO: Admin sidebar */}
        {/* Contractors | Reviews | Import | Analytics | Coupons */}
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
