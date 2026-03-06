'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  SYSTEM_TYPES,
  BUILDING_TYPES,
  HVAC_BRANDS,
  SERVICE_AGREEMENT_TYPES,
  DISPATCH_CRM_OPTIONS,
  US_STATES,
} from '@/lib/constants'

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700 mb-1">
      {children}
      {required && <span className="text-accent-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ id, label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label?: string; required?: boolean }) {
  return (
    <div>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      <input
        id={id}
        {...props}
        className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400"
      />
    </div>
  )
}

function Select({ id, label, required, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string; label?: string; required?: boolean }) {
  return (
    <div>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      <select
        id={id}
        {...props}
        className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-50 cursor-pointer"
      >
        {children}
      </select>
    </div>
  )
}

function Textarea({ id, label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label?: string }) {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <textarea
        id={id}
        {...props}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400 resize-y"
      />
    </div>
  )
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-neutral-200'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  )
}

function MultiCheckbox({ id, label, options, values, onChange }: {
  id: string
  label: string
  options: { value: string; label: string }[]
  values: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val))
    } else {
      onChange([...values, val])
    }
  }
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors',
              values.includes(opt.value)
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300',
            ].join(' ')}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={values.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            {values.includes(opt.value) && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-neutral-200 pb-3 mb-5">
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
    </div>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  // Basic info
  company_name: string
  phone: string
  email: string
  website: string
  street_address: string
  city: string
  state: string
  zip_code: string
  year_established: string
  license_number: string

  // Admin-only
  is_verified: boolean
  is_featured: boolean
  is_claimed: boolean
  commercial_verified: boolean
  insurance_verified: boolean
  subscription_tier: string
  slot_tier: string
  metro_area: string
  google_place_id: string

  // Descriptions
  description: string
  short_description: string

  // Commercial capabilities
  system_types: string[]
  building_types_served: string[]
  brands_serviced: string[]
  tonnage_range_min: string
  tonnage_range_max: string
  service_radius_miles: string
  years_commercial_experience: string

  // Operations
  num_technicians: string
  num_nate_certified: string
  emergency_response_minutes: string
  offers_24_7: boolean
  multi_site_coverage: boolean
  max_sites_supported: string
  offers_service_agreements: boolean
  service_agreement_types: string[]
  dispatch_crm: string
  uses_gps_tracking: boolean
  avg_quote_turnaround_hours: string
  sla_summary: string
}

const initialForm: FormData = {
  company_name: '',
  phone: '',
  email: '',
  website: '',
  street_address: '',
  city: '',
  state: '',
  zip_code: '',
  year_established: '',
  license_number: '',
  is_verified: false,
  is_featured: false,
  is_claimed: false,
  commercial_verified: false,
  insurance_verified: false,
  subscription_tier: 'free',
  slot_tier: '',
  metro_area: '',
  google_place_id: '',
  description: '',
  short_description: '',
  system_types: [],
  building_types_served: [],
  brands_serviced: [],
  tonnage_range_min: '',
  tonnage_range_max: '',
  service_radius_miles: '50',
  years_commercial_experience: '',
  num_technicians: '',
  num_nate_certified: '',
  emergency_response_minutes: '',
  offers_24_7: false,
  multi_site_coverage: false,
  max_sites_supported: '',
  offers_service_agreements: false,
  service_agreement_types: [],
  dispatch_crm: '',
  uses_gps_tracking: false,
  avg_quote_turnaround_hours: '',
  sla_summary: '',
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function AdminAddContractorPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const set = (field: keyof FormData, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateAIDescription = async () => {
    if (!form.company_name.trim()) {
      setError('Enter a company name before generating a description')
      return
    }
    setAiLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_data: { ...form } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate description')
        return
      }
      set('description', data.description)
    } catch {
      setError('Failed to generate AI description')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.company_name.trim()) return setError('Company name is required')
    if (!form.city.trim()) return setError('City is required')
    if (!form.state) return setError('State is required')

    setLoading(true)
    try {
      const res = await fetch('/api/admin/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slot_tier: form.slot_tier || null,
          dispatch_crm: form.dispatch_crm || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create contractor')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/contractors')
      }, 1500)
    } catch (err) {
      console.error('Submit error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-neutral-900">Contractor created!</p>
          <p className="text-sm text-neutral-500 mt-1">Redirecting to contractors list…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Add Contractor</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Manually create a contractor profile</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" x2="9" y1="9" y2="15"/>
            <line x1="9" x2="15" y1="9" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Admin Controls ─────────────────────────────── */}
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent-500 text-white uppercase tracking-wide">ADMIN</span>
            <h3 className="text-sm font-semibold text-neutral-200">Admin-Only Fields</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div>
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <select
                id="subscription_tier"
                value={form.subscription_tier}
                onChange={e => set('subscription_tier', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-neutral-700 rounded-lg bg-neutral-800 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="free">Free</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div>
              <Label htmlFor="slot_tier">Slot Tier</Label>
              <select
                id="slot_tier"
                value={form.slot_tier}
                onChange={e => set('slot_tier', e.target.value)}
                className="w-full h-9 px-3 text-sm border border-neutral-700 rounded-lg bg-neutral-800 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">None</option>
                <option value="standard">Standard</option>
                <option value="preferred">Preferred</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label htmlFor="metro_area" className="block text-sm font-medium text-neutral-400 mb-1">Metro Area</label>
              <input
                id="metro_area"
                type="text"
                value={form.metro_area}
                onChange={e => set('metro_area', e.target.value)}
                placeholder="e.g. Dallas-Fort Worth"
                className="w-full h-9 px-3 text-sm border border-neutral-700 rounded-lg bg-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {([
              { id: 'is_verified', label: 'Verified' },
              { id: 'is_featured', label: 'Featured' },
              { id: 'is_claimed', label: 'Claimed' },
              { id: 'commercial_verified', label: 'Comm. Verified' },
              { id: 'insurance_verified', label: 'Ins. Verified' },
            ] as const).map(({ id, label }) => (
              <label key={id} htmlFor={id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id={id}
                  checked={form[id] as boolean}
                  onChange={e => set(id, e.target.checked)}
                  className="rounded border-neutral-600 text-primary-500 focus:ring-primary-500 bg-neutral-800"
                />
                <span className="text-sm text-neutral-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Basic Info ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <SectionHeader title="Basic Information" description="Company name, contact details, and location" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                id="company_name"
                label="Company Name"
                required
                type="text"
                value={form.company_name}
                onChange={e => set('company_name', e.target.value)}
                placeholder="Acme HVAC Services"
              />
            </div>
            <Input
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="(555) 000-0000"
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="contact@company.com"
            />
            <Input
              id="website"
              label="Website"
              type="url"
              value={form.website}
              onChange={e => set('website', e.target.value)}
              placeholder="https://company.com"
            />
            <Input
              id="google_place_id"
              label="Google Place ID"
              type="text"
              value={form.google_place_id}
              onChange={e => set('google_place_id', e.target.value)}
              placeholder="ChIJN1t_tDeuEmsR..."
            />
            <Input
              id="license_number"
              label="License Number"
              type="text"
              value={form.license_number}
              onChange={e => set('license_number', e.target.value)}
              placeholder="LIC-123456"
            />
            <div className="sm:col-span-2">
              <Input
                id="street_address"
                label="Street Address"
                type="text"
                value={form.street_address}
                onChange={e => set('street_address', e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <Input
              id="city"
              label="City"
              required
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="Dallas"
            />
            <Select
              id="state"
              label="State"
              required
              value={form.state}
              onChange={e => set('state', e.target.value)}
            >
              <option value="">Select state…</option>
              {US_STATES.map(s => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </Select>
            <Input
              id="zip_code"
              label="ZIP Code"
              type="text"
              value={form.zip_code}
              onChange={e => set('zip_code', e.target.value)}
              placeholder="75201"
            />
            <Input
              id="year_established"
              label="Year Established"
              type="number"
              value={form.year_established}
              onChange={e => set('year_established', e.target.value)}
              placeholder="2005"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        {/* ── Descriptions ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <SectionHeader title="Descriptions" />
          <div className="space-y-4">
            <div>
              <label htmlFor="short_description" className="block text-sm font-medium text-neutral-700 mb-1">
                Short Description <span className="text-neutral-400 font-normal">(max 160 chars)</span>
              </label>
              <input
                id="short_description"
                type="text"
                value={form.short_description}
                onChange={e => set('short_description', e.target.value.slice(0, 160))}
                placeholder="Brief tagline shown in search results…"
                maxLength={160}
                className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-neutral-400"
              />
              <div className="text-right text-xs text-neutral-400 mt-0.5">{form.short_description.length}/160</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Full Description</Label>
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-wait transition-all shadow-sm"
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Writing…
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3l1.912 5.813L20 12l-6.088 3.187L12 21l-1.912-5.813L4 12l6.088-3.187z"/>
                      </svg>
                      Write with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="description"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Detailed company description, specialties, certifications…"
                rows={5}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400 resize-y"
              />
              {form.description && (
                <div className="text-right text-xs text-neutral-400 mt-0.5">{form.description.split(/\s+/).filter(Boolean).length} words</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Commercial Capabilities ───────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <SectionHeader title="Commercial Capabilities" description="Systems, buildings, and service scope" />
          <div className="space-y-5">
            <MultiCheckbox
              id="system_types"
              label="System Types"
              options={SYSTEM_TYPES.map(s => ({ value: s.value, label: s.label }))}
              values={form.system_types}
              onChange={v => set('system_types', v)}
            />
            <MultiCheckbox
              id="building_types"
              label="Building Types Served"
              options={BUILDING_TYPES.map(b => ({ value: b.value, label: b.label }))}
              values={form.building_types_served}
              onChange={v => set('building_types_served', v)}
            />
            <MultiCheckbox
              id="brands_serviced"
              label="Brands Serviced"
              options={HVAC_BRANDS.map(b => ({ value: b, label: b }))}
              values={form.brands_serviced}
              onChange={v => set('brands_serviced', v)}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                id="tonnage_min"
                label="Min Tonnage"
                type="number"
                value={form.tonnage_range_min}
                onChange={e => set('tonnage_range_min', e.target.value)}
                placeholder="5"
                min="0"
              />
              <Input
                id="tonnage_max"
                label="Max Tonnage"
                type="number"
                value={form.tonnage_range_max}
                onChange={e => set('tonnage_range_max', e.target.value)}
                placeholder="500"
                min="0"
              />
              <Input
                id="service_radius"
                label="Service Radius (mi)"
                type="number"
                value={form.service_radius_miles}
                onChange={e => set('service_radius_miles', e.target.value)}
                placeholder="50"
                min="0"
              />
              <Input
                id="years_commercial_exp"
                label="Yrs Commercial Exp."
                type="number"
                value={form.years_commercial_experience}
                onChange={e => set('years_commercial_experience', e.target.value)}
                placeholder="10"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* ── Operations ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <SectionHeader title="Operations & Capabilities" />
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                id="num_technicians"
                label="# Technicians"
                type="number"
                value={form.num_technicians}
                onChange={e => set('num_technicians', e.target.value)}
                placeholder="15"
                min="0"
              />
              <Input
                id="num_nate"
                label="# NATE Certified"
                type="number"
                value={form.num_nate_certified}
                onChange={e => set('num_nate_certified', e.target.value)}
                placeholder="8"
                min="0"
              />
              <Input
                id="emergency_response"
                label="Emergency Response (min)"
                type="number"
                value={form.emergency_response_minutes}
                onChange={e => set('emergency_response_minutes', e.target.value)}
                placeholder="120"
                min="0"
              />
              <Input
                id="avg_quote_turnaround"
                label="Avg Quote Turnaround (hrs)"
                type="number"
                value={form.avg_quote_turnaround_hours}
                onChange={e => set('avg_quote_turnaround_hours', e.target.value)}
                placeholder="4"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Toggle id="offers_24_7" label="24/7 Service" checked={form.offers_24_7} onChange={v => set('offers_24_7', v)} />
              <Toggle id="multi_site" label="Multi-Site Coverage" checked={form.multi_site_coverage} onChange={v => set('multi_site_coverage', v)} />
              <Toggle id="uses_gps" label="GPS Tracking" checked={form.uses_gps_tracking} onChange={v => set('uses_gps_tracking', v)} />
              <Toggle id="offers_sla" label="Service Agreements" checked={form.offers_service_agreements} onChange={v => set('offers_service_agreements', v)} />
            </div>

            {form.multi_site_coverage && (
              <Input
                id="max_sites"
                label="Max Sites Supported"
                type="number"
                value={form.max_sites_supported}
                onChange={e => set('max_sites_supported', e.target.value)}
                placeholder="50"
                min="0"
              />
            )}

            {form.offers_service_agreements && (
              <MultiCheckbox
                id="service_agreement_types"
                label="Service Agreement Types"
                options={SERVICE_AGREEMENT_TYPES.map(s => ({ value: s.value, label: s.label }))}
                values={form.service_agreement_types}
                onChange={v => set('service_agreement_types', v)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="dispatch_crm"
                label="Dispatch / CRM"
                value={form.dispatch_crm}
                onChange={e => set('dispatch_crm', e.target.value)}
              >
                <option value="">None / Not specified</option>
                {DISPATCH_CRM_OPTIONS.map(crm => (
                  <option key={crm} value={crm}>{crm}</option>
                ))}
              </Select>
            </div>

            <Textarea
              id="sla_summary"
              label="SLA Summary"
              value={form.sla_summary}
              onChange={e => set('sla_summary', e.target.value)}
              placeholder="Brief description of service level commitments…"
              rows={3}
            />
          </div>
        </div>

        {/* ── Submit ────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Contractor
          </Button>
        </div>
      </form>
    </div>
  )
}
