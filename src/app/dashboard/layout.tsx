import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'
import type { Contractor } from '@/lib/types'
import Logo from '@/components/Logo'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/>
        <rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Edit Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/photos',
    label: 'Photos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/reviews',
    label: 'Reviews',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/leads',
    label: 'Leads',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.61-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" x2="18" y1="20" y2="10"/>
        <line x1="12" x2="12" y1="20" y2="4"/>
        <line x1="6" x2="6" y1="20" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/billing',
    label: 'Billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
]

// Mobile bottom nav shows only 5 key items
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(item =>
  ['/dashboard', '/dashboard/leads', '/dashboard/reviews', '/dashboard/profile', '/dashboard/messages'].includes(item.href)
)

const TIER_BADGE_CLASSES: Record<string, string> = {
  free: 'bg-neutral-100 text-neutral-600',
  bronze: 'bg-amber-50 text-amber-700 border border-amber-200',
  silver: 'bg-neutral-100 text-neutral-600 border border-neutral-300',
  gold: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
}

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

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, company_name, slug, subscription_tier, is_verified, commercial_verified')
    .eq('owner_id', user.id)
    .single()

  if (!contractor) {
    redirect('/register')
  }

  const tierInfo = SUBSCRIPTION_TIERS[contractor.subscription_tier as keyof typeof SUBSCRIPTION_TIERS]
  const tierBadgeClass = TIER_BADGE_CLASSES[contractor.subscription_tier] ?? TIER_BADGE_CLASSES.free

  // Get current path for active link detection — using headers to read x-pathname
  const headersList = await headers()
  const currentPath = headersList.get('x-pathname') ?? '/dashboard'

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* ── Desktop Sidebar ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-neutral-200">
          <Link href="/dashboard" aria-label="Dashboard home">
            <Logo />
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Dashboard navigation">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? currentPath === '/dashboard'
                  : currentPath.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={isActive ? 'text-primary-600' : 'text-neutral-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Contractor info footer */}
        <div className="p-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          <Link
            href={`/contractors/${contractor.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 text-xs text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" x2="21" y1="14" y2="3"/>
            </svg>
            View Public Listing
          </Link>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <Link href="/dashboard" className="lg:hidden" aria-label="Dashboard home">
              <Logo />
            </Link>
            <div className="hidden lg:block">
              <h1 className="text-sm font-semibold text-neutral-900 leading-tight">
                {contractor.company_name}
              </h1>
              {contractor.is_verified && (
                <span className="text-xs text-success font-medium">✓ Verified</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subscription badge */}
            <span className={[
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
              tierBadgeClass,
            ].join(' ')}>
              {tierInfo?.name ?? contractor.subscription_tier} Plan
            </span>

            {/* User avatar / sign out */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                title="Sign out"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ──────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 z-30 safe-area-inset-bottom"
        aria-label="Mobile dashboard navigation"
      >
        <ul className="flex">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? currentPath === '/dashboard'
                : currentPath.startsWith(item.href)
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={[
                    'flex flex-col items-center gap-1 py-2.5 px-1 text-center transition-colors duration-150',
                    isActive ? 'text-primary-600' : 'text-neutral-400',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
