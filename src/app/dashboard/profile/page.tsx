'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  BUILDING_TYPES,
  SYSTEM_TYPES,
  HVAC_BRANDS,
  SERVICE_AGREEMENT_TYPES,
  DISPATCH_CRM_OPTIONS,
  US_STATES,
} from '@/lib/constants'
import type { Contractor } from '@/lib/types'

type Tab = 'basic' | 'commercial' | 'operations' | 'description'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'commercial', label: 'Commercial Capabilities' },
  { id: 'operations', label: 'Operations & SLAs' },
  { id: 'description', label: 'Description' },
]

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'fixed bottom-24 lg:bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm transition-all duration-300',
        type === 'success' ? 'bg-green-600 text-white' : 'bg-error text-white',
      ].join(' ')}
    >
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="8" y2="12"/>
          <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
      )}
      {message}
      <button
        onClick={onClose}
        className="ml-auto shrink-0 opacity-80 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" x2="6" y1="6" y2="18"/>
          <line x1="6" x2="18" y1="6" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700 mb-1.5">
      {children}
    </label>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        'disabled:bg-neutral-50 disabled:text-neutral-500',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[
        'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </select>
  )
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 resize-y min-h-[100px]',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

function MultiCheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: readonly { value: T; label: string }[]
  selected: T[]
  onChange: (values: T[]) => void
  columns?: number
}) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
      {options.map(opt => (
        <label
          key={opt.value}
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors duration-150',
            selected.includes(opt.value)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
          ].join(' ')}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="sr-only"
          />
          <span className={[
            'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center',
            selected.includes(opt.value) ? 'bg-primary-500 border-primary-500' : 'border-neutral-300',
          ].join(' ')} aria-hidden="true">
            {selected.includes(opt.value) && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </span>
          {opt.label}
        </label>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [form, setForm] = useState({
    // Basic
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
    num_technicians: '',
    service_radius_miles: '',
    // Commercial
    years_commercial_experience: '',
    system_types: [] as string[],
    brands_serviced: [] as string[],
    building_types_served: [] as string[],
    tonnage_range_min: '',
    tonnage_range_max: '',
    // Operations
    offers_24_7: false,
    emergency_response_minutes: '',
    multi_site_coverage: false,
    max_sites_supported: '',
    offers_service_agreements: false,
    service_agreement_types: [] as string[],
    dispatch_crm: '',
    avg_quote_turnaround_hours: '',
    uses_gps_tracking: false,
    num_nate_certified: '',
    sla_summary: '',
    // Description
    description: '',
    short_description: '',
  })

  const loadContractor = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error || !data) { setLoading(false); return }

    setContractor(data as Contractor)

    const c = data as Contractor
    setForm({
      company_name: c.company_name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      website: c.website ?? '',
      street_address: c.street_address ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      zip_code: c.zip_code ?? '',
      year_established: c.year_established?.toString() ?? '',
      license_number: c.license_number ?? '',
      num_technicians: c.num_technicians?.toString() ?? '',
      service_radius_miles: c.service_radius_miles?.toString() ?? '',
      years_commercial_experience: c.years_commercial_experience?.toString() ?? '',
      system_types: c.system_types ?? [],
      brands_serviced: c.brands_serviced ?? [],
      building_types_served: c.building_types_served ?? [],
      tonnage_range_min: c.tonnage_range_min?.toString() ?? '',
      tonnage_range_max: c.tonnage_range_max?.toString() ?? '',
      offers_24_7: c.offers_24_7 ?? false,
      emergency_response_minutes: c.emergency_response_minutes?.toString() ?? '',
      multi_site_coverage: c.multi_site_coverage ?? false,
      max_sites_supported: c.max_sites_supported?.toString() ?? '',
      offers_service_agreements: c.offers_service_agreements ?? false,
      service_agreement_types: c.service_agreement_types ?? [],
      dispatch_crm: c.dispatch_crm ?? '',
      avg_quote_turnaround_hours: c.avg_quote_turnaround_hours?.toString() ?? '',
      uses_gps_tracking: c.uses_gps_tracking ?? false,
      num_nate_certified: c.num_nate_certified?.toString() ?? '',
      sla_summary: c.sla_summary ?? '',
      description: c.description ?? '',
      short_description: c.short_description ?? '',
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadContractor() }, [loadContractor])

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!contractor) return
    setSaving(true)

    const payload = {
      company_name: form.company_name,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      street_address: form.street_address || null,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code || null,
      year_established: form.year_established ? parseInt(form.year_established) : null,
      license_number: form.license_number || null,
      num_technicians: form.num_technicians ? parseInt(form.num_technicians) : null,
      service_radius_miles: form.service_radius_miles ? parseInt(form.service_radius_miles) : 50,
      years_commercial_experience: form.years_commercial_experience ? parseInt(form.years_commercial_experience) : null,
      system_types: form.system_types,
      brands_serviced: form.brands_serviced,
      building_types_served: form.building_types_served,
      tonnage_range_min: form.tonnage_range_min ? parseFloat(form.tonnage_range_min) : null,
      tonnage_range_max: form.tonnage_range_max ? parseFloat(form.tonnage_range_max) : null,
      offers_24_7: form.offers_24_7,
      emergency_response_minutes: form.emergency_response_minutes ? parseInt(form.emergency_response_minutes) : null,
      multi_site_coverage: form.multi_site_coverage,
      max_sites_supported: form.max_sites_supported ? parseInt(form.max_sites_supported) : null,
      offers_service_agreements: form.offers_service_agreements,
      service_agreement_types: form.service_agreement_types,
      dispatch_crm: form.dispatch_crm || null,
      avg_quote_turnaround_hours: form.avg_quote_turnaround_hours ? parseFloat(form.avg_quote_turnaround_hours) : null,
      uses_gps_tracking: form.uses_gps_tracking,
      num_nate_certified: form.num_nate_certified ? parseInt(form.num_nate_certified) : null,
      sla_summary: form.sla_summary || null,
      description: form.description || null,
      short_description: form.short_description || null,
    }

    const { error } = await supabase
      .from('contractors')
      .update(payload)
      .eq('id', contractor.id)

    setSaving(false)
    if (error) {
      setToast({ message: `Save failed: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Profile saved successfully', type: 'success' })
      // Refresh contractor
      const { data } = await supabase.from('contractors').select('*').eq('id', contractor.id).single()
      if (data) setContractor(data as Contractor)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48"/>
          <div className="h-12 bg-neutral-200 rounded"/>
          <div className="h-64 bg-neutral-200 rounded"/>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-neutral-500">Unable to load your profile. Please refresh the page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold font-display text-neutral-900">Edit Profile</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Changes update your public listing immediately.{' '}
            <Link
              href={`/contractors/${contractor.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              View public listing →
            </Link>
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          className="shrink-0"
        >
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200">
          <nav className="flex overflow-x-auto" aria-label="Profile sections">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 -mb-px',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300',
                ].join(' ')}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6" role="tabpanel">
          {/* ── Basic Info ─────────────────────────────── */}
          {activeTab === 'basic' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <FieldLabel htmlFor="company_name">Company Name *</FieldLabel>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={e => setField('company_name', e.target.value)}
                  placeholder="ACME HVAC Services"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => setField('phone', e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="email">Contact Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={e => setField('website', e.target.value)}
                  placeholder="https://www.company.com"
                />
              </div>

              <div>
                <FieldLabel htmlFor="street_address">Street Address</FieldLabel>
                <Input
                  id="street_address"
                  value={form.street_address}
                  onChange={e => setField('street_address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <FieldLabel htmlFor="city">City *</FieldLabel>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={e => setField('city', e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="state">State *</FieldLabel>
                  <Select
                    id="state"
                    value={form.state}
                    onChange={e => setField('state', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {US_STATES.map(s => (
                      <option key={s.abbr} value={s.abbr}>{s.abbr}</option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-1">
                  <FieldLabel htmlFor="zip_code">ZIP</FieldLabel>
                  <Input
                    id="zip_code"
                    value={form.zip_code}
                    onChange={e => setField('zip_code', e.target.value)}
                    placeholder="90210"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel htmlFor="year_established">Year Est.</FieldLabel>
                  <Input
                    id="year_established"
                    type="number"
                    value={form.year_established}
                    onChange={e => setField('year_established', e.target.value)}
                    placeholder="2005"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="num_technicians">Technicians</FieldLabel>
                  <Input
                    id="num_technicians"
                    type="number"
                    value={form.num_technicians}
                    onChange={e => setField('num_technicians', e.target.value)}
                    placeholder="12"
                    min={1}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="service_radius_miles">Service Radius (mi)</FieldLabel>
                  <Input
                    id="service_radius_miles"
                    type="number"
                    value={form.service_radius_miles}
                    onChange={e => setField('service_radius_miles', e.target.value)}
                    placeholder="50"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="license_number">License Number</FieldLabel>
                <Input
                  id="license_number"
                  value={form.license_number}
                  onChange={e => setField('license_number', e.target.value)}
                  placeholder="CA-12345"
                />
              </div>
            </div>
          )}

          {/* ── Commercial Capabilities ────────────────── */}
          {activeTab === 'commercial' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <FieldLabel htmlFor="years_commercial_experience">Years of Commercial Experience</FieldLabel>
                <Input
                  id="years_commercial_experience"
                  type="number"
                  value={form.years_commercial_experience}
                  onChange={e => setField('years_commercial_experience', e.target.value)}
                  placeholder="10"
                  min={0}
                  className="max-w-xs"
                />
              </div>

              <div>
                <FieldLabel>System Types Serviced</FieldLabel>
                <MultiCheckboxGroup
                  options={SYSTEM_TYPES}
                  selected={form.system_types as typeof SYSTEM_TYPES[number]['value'][]}
                  onChange={vals => setField('system_types', vals)}
                  columns={2}
                />
              </div>

              <div>
                <FieldLabel>Building Types Served</FieldLabel>
                <MultiCheckboxGroup
                  options={BUILDING_TYPES}
                  selected={form.building_types_served as typeof BUILDING_TYPES[number]['value'][]}
                  onChange={vals => setField('building_types_served', vals)}
                  columns={2}
                />
              </div>

              <div>
                <FieldLabel>Brands Serviced</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HVAC_BRANDS.map(brand => {
                    const isSelected = form.brands_serviced.includes(brand)
                    return (
                      <label
                        key={brand}
                        className={[
                          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors duration-150',
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setField('brands_serviced', form.brands_serviced.filter(b => b !== brand))
                            } else {
                              setField('brands_serviced', [...form.brands_serviced, brand])
                            }
                          }}
                          className="sr-only"
                        />
                        <span className={[
                          'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center',
                          isSelected ? 'bg-primary-500 border-primary-500' : 'border-neutral-300',
                        ].join(' ')} aria-hidden="true">
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        {brand}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="tonnage_min">Min Tonnage</FieldLabel>
                  <Input
                    id="tonnage_min"
                    type="number"
                    value={form.tonnage_range_min}
                    onChange={e => setField('tonnage_range_min', e.target.value)}
                    placeholder="5"
                    min={0}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="tonnage_max">Max Tonnage</FieldLabel>
                  <Input
                    id="tonnage_max"
                    type="number"
                    value={form.tonnage_range_max}
                    onChange={e => setField('tonnage_range_max', e.target.value)}
                    placeholder="500"
                    min={0}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Operations & SLAs ─────────────────────── */}
          {activeTab === 'operations' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-3">
                <input
                  id="offers_24_7"
                  type="checkbox"
                  checked={form.offers_24_7}
                  onChange={e => setField('offers_24_7', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="offers_24_7" className="text-sm font-medium text-neutral-700">
                  Offers 24/7 emergency service
                </label>
              </div>

              <div>
                <FieldLabel htmlFor="emergency_response">Emergency Response Time (minutes)</FieldLabel>
                <Input
                  id="emergency_response"
                  type="number"
                  value={form.emergency_response_minutes}
                  onChange={e => setField('emergency_response_minutes', e.target.value)}
                  placeholder="120"
                  min={0}
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="multi_site"
                  type="checkbox"
                  checked={form.multi_site_coverage}
                  onChange={e => setField('multi_site_coverage', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="multi_site" className="text-sm font-medium text-neutral-700">
                  Supports multi-site / portfolio accounts
                </label>
              </div>

              {form.multi_site_coverage && (
                <div>
                  <FieldLabel htmlFor="max_sites">Max Sites Supported</FieldLabel>
                  <Input
                    id="max_sites"
                    type="number"
                    value={form.max_sites_supported}
                    onChange={e => setField('max_sites_supported', e.target.value)}
                    placeholder="25"
                    min={1}
                    className="max-w-xs"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  id="service_agreements"
                  type="checkbox"
                  checked={form.offers_service_agreements}
                  onChange={e => setField('offers_service_agreements', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="service_agreements" className="text-sm font-medium text-neutral-700">
                  Offers service agreements / maintenance contracts
                </label>
              </div>

              {form.offers_service_agreements && (
                <div>
                  <FieldLabel>Service Agreement Types</FieldLabel>
                  <MultiCheckboxGroup
                    options={SERVICE_AGREEMENT_TYPES}
                    selected={form.service_agreement_types as typeof SERVICE_AGREEMENT_TYPES[number]['value'][]}
                    onChange={vals => setField('service_agreement_types', vals)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="dispatch_crm">Dispatch / CRM Software</FieldLabel>
                  <Select
                    id="dispatch_crm"
                    value={form.dispatch_crm}
                    onChange={e => setField('dispatch_crm', e.target.value)}
                  >
                    <option value="">Select (optional)</option>
                    {DISPATCH_CRM_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="quote_turnaround">Avg Quote Turnaround (hours)</FieldLabel>
                  <Input
                    id="quote_turnaround"
                    type="number"
                    value={form.avg_quote_turnaround_hours}
                    onChange={e => setField('avg_quote_turnaround_hours', e.target.value)}
                    placeholder="24"
                    min={0}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="gps_tracking"
                  type="checkbox"
                  checked={form.uses_gps_tracking}
                  onChange={e => setField('uses_gps_tracking', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="gps_tracking" className="text-sm font-medium text-neutral-700">
                  Uses GPS fleet tracking
                </label>
              </div>

              <div>
                <FieldLabel htmlFor="nate_certified">NATE-Certified Technicians</FieldLabel>
                <Input
                  id="nate_certified"
                  type="number"
                  value={form.num_nate_certified}
                  onChange={e => setField('num_nate_certified', e.target.value)}
                  placeholder="4"
                  min={0}
                  className="max-w-xs"
                />
              </div>

              <div>
                <FieldLabel htmlFor="sla_summary">SLA Summary</FieldLabel>
                <Textarea
                  id="sla_summary"
                  value={form.sla_summary}
                  onChange={e => setField('sla_summary', e.target.value)}
                  placeholder="Briefly describe your service level commitments (e.g., 4-hour response guarantee, dedicated account manager, etc.)"
                  rows={4}
                />
                <p className="text-xs text-neutral-400 mt-1">{form.sla_summary.length}/500 characters</p>
              </div>
            </div>
          )}

          {/* ── Description ────────────────────────────── */}
          {activeTab === 'description' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <FieldLabel htmlFor="short_description">Short Description</FieldLabel>
                <p className="text-xs text-neutral-500 mb-2">
                  Shown on search results cards. Keep it to 1-2 sentences (under 160 characters).
                </p>
                <Input
                  id="short_description"
                  value={form.short_description}
                  onChange={e => setField('short_description', e.target.value)}
                  placeholder="Full-service commercial HVAC contractor serving the Greater LA area since 2003."
                  maxLength={200}
                />
                <p className="text-xs text-neutral-400 mt-1">{form.short_description.length}/200 characters</p>
              </div>

              <div>
                <FieldLabel htmlFor="description">Full Description</FieldLabel>
                <p className="text-xs text-neutral-500 mb-2">
                  Appears on your full profile page. Include your specializations, certifications, and key differentiators.
                </p>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Tell customers about your company, your team's expertise, types of buildings you serve, and why they should choose you..."
                  rows={10}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-neutral-400 mt-1">{form.description.length} characters</p>
              </div>
            </div>
          )}

          {/* Save button at bottom of each tab */}
          <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-xs text-neutral-400">Changes are saved to your live profile</p>
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
