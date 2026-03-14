'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MessageSquare, CheckCircle, AlertCircle, Loader2, Building2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

const CONTACT_REASONS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'contractor_listing', label: 'Contractor Listing Question' },
  { value: 'advertising', label: 'Advertising / Partnerships' },
  { value: 'press', label: 'Press / Media' },
  { value: 'bug_report', label: 'Report a Bug' },
  { value: 'privacy', label: 'Privacy / Data Request' },
  { value: 'other', label: 'Other' },
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    reason: 'general',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }

      setSuccess(true)
      trackEvent('contact_form_submitted', { form_reason: form.reason })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Message Sent</h1>
          <p className="text-neutral-600 mb-6">
            Thanks for reaching out. We typically respond within one business day.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-8 h-8 text-sky-400" />
            <span className="text-sm font-medium text-sky-400 uppercase tracking-wider">Contact</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Get in Touch</h1>
          <p className="mt-3 text-neutral-400 max-w-lg">
            Questions about My HVAC Tech? Want to list your business? Have feedback? We&rsquo;d like to hear from you.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Acme Properties LLC"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Reason for Contact
                </label>
                <select
                  id="reason"
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {CONTACT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  placeholder="How can we help?"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>

              <p className="text-xs text-neutral-400">
                By submitting this form, you agree to our{' '}
                <Link href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Direct Contact</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Email</p>
                    <a href="mailto:info@myhvac.tech" className="text-sm text-sky-600 hover:underline">
                      info@myhvac.tech
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-semibold text-sky-900">Are you an HVAC contractor?</h3>
              </div>
              <p className="text-sm text-sky-800 mb-4">
                Get your business in front of property and facility managers looking for commercial HVAC services.
              </p>
              <Link
                href="/for-contractors"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800"
              >
                Learn about listing your business &rarr;
              </Link>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-2">Privacy Requests</h3>
              <p className="text-sm text-amber-800 mb-3">
                For data access, correction, or deletion requests under CCPA, CPRA, or other state privacy laws:
              </p>
              <a href="mailto:privacy@myhvac.tech" className="text-sm font-semibold text-amber-700 hover:underline">
                privacy@myhvac.tech
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
