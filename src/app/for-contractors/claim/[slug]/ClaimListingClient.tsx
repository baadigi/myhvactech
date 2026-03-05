'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CheckCircle, AlertTriangle, Building2, MapPin, ArrowLeft, ShieldCheck } from 'lucide-react'

interface ContractorInfo {
  id: string
  company_name: string
  city: string
  state: string
  phone: string | null
  is_claimed: boolean
  slug: string
}

interface ClaimFormData {
  contact_name: string
  contact_email: string
  contact_phone: string
  job_title: string
  message: string
}

export default function ClaimListingClient({ contractor }: { contractor: ContractorInfo }) {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [form, setForm] = useState<ClaimFormData>({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    job_title: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingClaim, setExistingClaim] = useState<string | null>(null)

  // Check auth status
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser?.email) {
        setForm(prev => ({ ...prev, contact_email: currentUser.email || '' }))
      }
      setAuthLoading(false)
    }
    checkAuth()
  }, [])

  const set = (field: keyof ClaimFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.contact_name.trim()) return setError('Your name is required.')
    if (!form.contact_email.trim()) return setError('Your email is required.')

    setLoading(true)

    try {
      const res = await fetch('/api/claim-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: contractor.id,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone || null,
          job_title: form.job_title || null,
          message: form.message || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit claim')
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Already claimed
  if (contractor.is_claimed) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 font-display">
            Listing Already Claimed
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            The listing for <span className="font-medium text-neutral-700">{contractor.company_name}</span> has
            already been claimed. If you believe this is an error, please{' '}
            <Link href="/contact" className="text-primary-500 hover:text-primary-600 font-medium">
              contact us
            </Link>.
          </p>
          <Link
            href={`/contractors/${contractor.slug}`}
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft size={14} />
            Back to listing
          </Link>
        </div>
      </main>
    )
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 font-display">
            Claim Submitted
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your claim for <span className="font-medium text-neutral-700">{contractor.company_name}</span> has
            been submitted. Our team will review it and get back to you at{' '}
            <span className="font-medium text-neutral-700">{form.contact_email}</span> within 1–2 business days.
          </p>
          <div className="mt-6 space-y-2">
            <Link
              href={`/contractors/${contractor.slug}`}
              className="block w-full text-center px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
            >
              View Listing
            </Link>
            <Link
              href="/for-contractors"
              className="block w-full text-center px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Explore Contractor Benefits
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Auth loading state
  if (authLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-neutral-400 text-sm">Loading…</div>
      </main>
    )
  }

  // Not logged in — prompt to sign up / log in
  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <ShieldCheck className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900 font-display">
              Claim Your Listing
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Sign in or create an account to claim the listing for{' '}
              <span className="font-medium text-neutral-700">{contractor.company_name}</span>.
            </p>
          </div>

          {/* Contractor info card */}
          <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{contractor.company_name}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />
                  {contractor.city}, {contractor.state}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/signup?next=${encodeURIComponent(`/for-contractors/claim/${contractor.slug}`)}`}
              className="block w-full text-center px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
            >
              Create Account
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(`/for-contractors/claim/${contractor.slug}`)}`}
              className="block w-full text-center px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Log In
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-400 text-center">
            After signing in, you can submit your claim for review.
          </p>
        </div>
      </main>
    )
  }

  // Logged in — show claim form
  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link
          href={`/contractors/${contractor.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to listing
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-6 py-5">
            <h1 className="text-lg font-semibold text-white font-display">
              Claim Your Listing
            </h1>
            <p className="text-sm text-primary-200 mt-0.5">
              Verify you own or manage this business
            </p>
          </div>

          {/* Contractor info */}
          <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{contractor.company_name}</p>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} />
                  {contractor.city}, {contractor.state}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-neutral-600 mb-2">
              Fill out the form below and our team will verify your ownership within 1–2 business days.
            </p>

            <div>
              <label htmlFor="contact_name" className="block text-sm font-medium text-neutral-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="John Smith"
                className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-neutral-700 mb-1">
                Business Email <span className="text-red-500">*</span>
              </label>
              <input
                id="contact_email"
                type="email"
                required
                value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
                placeholder="you@company.com"
                className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label htmlFor="job_title" className="block text-sm font-medium text-neutral-700 mb-1">
                  Job Title
                </label>
                <input
                  id="job_title"
                  type="text"
                  value={form.job_title}
                  onChange={e => set('job_title', e.target.value)}
                  placeholder="Owner, GM, etc."
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                Additional Info <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="message"
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Anything that helps us verify your ownership — e.g. your role, how long you've been with the company, etc."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400 resize-y"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              Submit Claim for Review
            </Button>

            <p className="text-xs text-neutral-400 text-center mt-2">
              By submitting, you confirm that you are authorized to manage this business listing.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
