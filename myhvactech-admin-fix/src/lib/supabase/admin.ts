import { createClient as createServerClient } from '@supabase/supabase-js'

/**
 * Admin/service-role Supabase client.
 * Bypasses Row Level Security — use only in admin API routes
 * after validating the requesting user is an admin.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey || serviceRoleKey === 'REPLACE_WITH_SERVICE_ROLE_KEY') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
