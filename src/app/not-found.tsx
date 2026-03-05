import Link from 'next/link'
import { Search, Home, Wrench } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import { SITE_NAME } from '@/lib/constants'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* SVG Illustration */}
        <div className="flex justify-center mb-8" aria-hidden="true">
          <svg
            width="160"
            height="120"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Building outline */}
            <rect x="30" y="40" width="100" height="70" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            {/* Roof outline */}
            <path d="M22 43 L80 12 L138 43" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#f8fafc" />
            {/* Windows */}
            <rect x="48" y="58" width="18" height="18" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
            <rect x="78" y="58" width="18" height="18" rx="2" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
            <rect x="108" y="58" width="18" height="18" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Door */}
            <rect x="66" y="82" width="28" height="28" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Rooftop unit */}
            <rect x="60" y="6" width="28" height="14" rx="3" fill="#134a8a" opacity="0.2" stroke="#134a8a" strokeWidth="1.5" />
            <circle cx="74" cy="13" r="4" fill="#134a8a" opacity="0.3" stroke="#134a8a" strokeWidth="1.5" />
            {/* Question mark */}
            <text x="74" y="16" textAnchor="middle" fontSize="8" fill="#134a8a" fontWeight="700" fontFamily="system-ui">?</text>
            {/* Disconnected lines */}
            <line x1="50" y1="4" x2="42" y2="16" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" />
            <line x1="98" y1="4" x2="106" y2="16" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" />
          </svg>
        </div>

        {/* 404 Badge */}
        <div className="inline-flex items-center gap-2 bg-neutral-200 rounded-full px-3 py-1 text-xs font-bold text-neutral-600 mb-4 tracking-widest">
          404
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 font-display mb-2">
          Page Not Found
        </h1>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Try searching for a contractor or browse from the links below.
        </p>

        {/* Search */}
        <div className="mb-8">
          <p className="text-sm font-medium text-neutral-700 mb-3">Find a commercial HVAC contractor</p>
          <SearchBar variant="compact" />
        </div>

        {/* Quick links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Home size={15} aria-hidden="true" />
            Go to Homepage
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            <Search size={15} aria-hidden="true" />
            Search Contractors
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            <Wrench size={15} aria-hidden="true" />
            Browse Services
          </Link>
        </div>

        <p className="mt-10 text-xs text-neutral-400">
          {SITE_NAME} — Commercial HVAC Contractor Directory
        </p>
      </div>
    </main>
  )
}
