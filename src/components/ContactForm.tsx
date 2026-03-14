'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { HVAC_SERVICES } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ContactFormProps {
  contractorId: string
  contractorName: string
  compact?: boolean
}

interface FormData {
  name: string
  email: string
  phone: string
  company_name: string
  service_needed: string
  message: string
  urgency: 'routine' | 'soon' | 'emergency'
  preferred_contact: 'email' | 'phone' | 'either'
}

const URGENCY_OPTIONS = [
  { value: 'routine' as const, label: 'Routine', description: 'Within 1–2 weeks' },
  { value: 'soon' as const, label: 'Soon', description: 'Within 2–3 days' },
  { value: 'emergency' as const, label: 'Emergency', description: 'Today / ASAP' },
]

const CONTACT_OPTIONS = [
  { value: 'email' as const, label: 'Email' },
  { value: 'phone' as const, label: 'Phone' },
  { value: 'either' as const, label: 'Either' },
]

export default function ContactForm({
  contractorId,
  contractorName,
  compact = false,
}: ContactFormProps) {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    service_needed: '',
    message: '',
    urgency: 'routine',
    preferred_contact: 'either',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const touch = (key: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const validate = () => {
    const errors: string[] = []
    if (!form.name.trim()) errors.push('Name is required')
    if (!form.email.trim()) errors.push('Email is required')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.push('Please enter a valid email address')
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate()
    if (errors.length > 0) {
      setError(errors[0])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contractor_id: contractorId,
          source: 'contractor_profile',
          landing_page: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }

      setSuccess(true)
      trackEvent('lead_submitted', {
        contractor_name: contractorName,
        urgency: form.urgency,
        service_needed: form.service_needed || 'not_specified',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle size={24} className="text-green-600" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900 mb-1">Request Sent!</h3>
        <p className="text-sm text-neutral-600">
          <span className="font-medium">{contractorName}</span> typically responds within 2 hours.
          We&apos;ll notify you by {form.preferred_contact === 'phone' ? 'phone' : 'email'}.
        </p>
        {form.urgency === 'emergency' && (
          <p className="mt-3 text-sm text-red-600 font-medium">
            For true emergencies, call them directly.
          </p>
        )}
      </div>
    )
  }

  const inputBase = cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
    'bg-white'
  )

  const labelBase = 'block text-xs font-medium text-neutral-700 mb-1'

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={`Contact ${contractorName}`}>
      <div className={cn('space-y-3', compact ? '' : 'space-y-4')}>

        {/* Name + Email */}
        <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          <div>
            <label htmlFor="cf-name" className={labelBase}>
              Your Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="cf-name"
              type="text"
              required
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => touch('name')}
              className={cn(
                inputBase,
                touched.name && !form.name.trim() ? 'border-red-300 focus:ring-red-500' : 'border-neutral-200'
              )}
            />
            {touched.name && !form.name.trim() && (
              <p className="text-xs text-red-600 mt-1">Name is required</p>
            )}
          </div>
          <div>
            <label htmlFor="cf-email" className={labelBase}>
              Email <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="cf-email"
              type="email"
              required
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={() => touch('email')}
              className={cn(
                inputBase,
                touched.email && !form.email.trim() ? 'border-red-300 focus:ring-red-500' : 'border-neutral-200'
              )}
            />
            {touched.email && !form.email.trim() && (
              <p className="text-xs text-red-600 mt-1">Email is required</p>
            )}
          </div>
        </div>

        {/* Phone + Company */}
        {!compact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-phone" className={labelBase}>
                Phone Number
              </label>
              <input
                id="cf-phone"
                type="tel"
                placeholder="(602) 555-0100"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className={cn(inputBase, 'border-neutral-200')}
              />
            </div>
            <div>
              <label htmlFor="cf-company" className={labelBase}>
                Company Name
              </label>
              <input
                id="cf-company"
                type="text"
                placeholder="Acme Properties LLC"
                value={form.company_name}
                onChange={(e) => setField('company_name', e.target.value)}
                className={cn(inputBase, 'border-neutral-200')}
              />
            </div>
          </div>
        )}

        {/* Service Needed */}
        <div>
          <label htmlFor="cf-service" className={labelBase}>
            Service Needed
          </label>
          <select
            id="cf-service"
            value={form.service_needed}
            onChange={(e) => setField('service_needed', e.target.value)}
            className={cn(inputBase, 'border-neutral-200')}
          >
            <option value="">Select a service…</option>
            {HVAC_SERVICES.map((svc) => (
              <option key={svc.slug} value={svc.slug}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="cf-message" className={labelBase}>
            Message
          </label>
          <textarea
            id="cf-message"
            rows={compact ? 3 : 4}
            placeholder="Describe your project, building type, square footage, or any other details…"
            value={form.message}
            onChange={(e) => setField('message', e.target.value)}
            className={cn(inputBase, 'border-neutral-200 resize-none')}
          />
        </div>

        {/* Urgency */}
        <div>
          <p className={cn(labelBase, 'mb-2')}>How soon do you need service?</p>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'relative flex flex-col items-center text-center px-2 py-2.5 rounded-lg border cursor-pointer transition-colors',
                  form.urgency === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300',
                  opt.value === 'emergency' && form.urgency === opt.value && 'border-red-500 bg-red-50 text-red-700'
                )}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={opt.value}
                  checked={form.urgency === opt.value}
                  onChange={() => setField('urgency', opt.value)}
                  className="sr-only"
                />
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] mt-0.5 leading-tight opacity-75">{opt.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Contact */}
        {!compact && (
          <div>
            <p className={cn(labelBase, 'mb-2')}>Preferred contact method</p>
            <div className="flex gap-2">
              {CONTACT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex-1 flex items-center justify-center px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors',
                    form.preferred_contact === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  )}
                >
                  <input
                    type="radio"
                    name="preferred_contact"
                    value={opt.value}
                    checked={form.preferred_contact === opt.value}
                    onChange={() => setField('preferred_contact', opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size={compact ? 'md' : 'lg'}
          loading={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Sending Request…
            </>
          ) : (
            'Send Request'
          )}
        </Button>

        <p className="text-[11px] text-center text-neutral-400">
          By submitting, you agree to our Terms of Service. No spam — ever.
        </p>
      </div>
    </form>
  )
}
