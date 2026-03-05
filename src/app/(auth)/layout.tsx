import Logo from '@/components/Logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Minimal header */}
      <header className="flex justify-center pt-8 pb-4">
        <Link href="/" aria-label="Go to My HVAC Tech home">
          <Logo />
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} My HVAC Tech. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
