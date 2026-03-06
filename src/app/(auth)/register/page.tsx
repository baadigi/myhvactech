'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
  SYSTEM_TYPES,
  BUILDING_TYPES,
  HVAC_BRANDS,
  HVAC_SERVICES,
  SERVICE_AGREEMENT_TYPES,
  DISPATCH_CRM_OPTIONS,
  US_STATES,
} from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Company Basics
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

  // Step 2 — Commercial Capabilities
  system_types: string[]
  building_types_served: string[]
  brands_serviced: string[]
  tonnage_range_min: string
  tonnage_range_max: string
  services_offered: string[] // slugs from HVAC_SERVICES

  // Step 3 — Operations & SLAs
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

  // Step 4 — Description & Review
  description: string
  short_description: string
}

const INITIAL_DATA: FormData = {
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
  system_types: [],
  building_types_served: [],
  brands_serviced: [],
  tonnage_range_min: '',
  tonnage_range_max: '',
  services_offered: [],
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
  description: '',
  short_description: '',
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Company Basics' },
  { number: 2, label: 'Capabilities' },
  { number: 3, label: 'Operations' },
  { number: 4, label: 'Review' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.number
        const isActive = currentStep === step.number
        const isUpcoming = currentStep < step.number

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isCompleted
                    ? 'bg-primary-500 text-white'
                    : isActive
                    ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                    : 'bg-neutral-200 text-neutral-500',
                ].join(' ')}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={[
                  'mt-1.5 text-xs font-medium hidden sm:block',
                  isActive ? 'text-primary-600' : isUpcoming ? 'text-neutral-400' : 'text-primary-500',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={[
                  'w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 mb-5 transition-colors',
                  currentStep > step.number ? 'bg-primary-500' : 'bg-neutral-200',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared Input Styles ──────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors'

const labelClass = 'block text-sm font-medium text-neutral-700 mb-1'

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        checked ? 'bg-primary-500' : 'bg-neutral-300',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ─── Checkbox Item ─────────────────────────────────────────────────────────────

function CheckboxItem({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id: string
}) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex items-center gap-2.5 border rounded-lg p-3 cursor-pointer transition-colors select-none',
        checked
          ? 'border-primary-500 bg-primary-50 text-primary-800'
          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
      ].join(' ')}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 shrink-0"
      />
      <span className="text-sm font-medium leading-tight">{label}</span>
    </label>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-neutral-900 mb-4">{children}</h2>
  )
}

// ─── Review Row ────────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="flex gap-3 py-2.5 border-b border-neutral-100 last:border-0">
      <dt className="w-44 shrink-0 text-sm text-neutral-500 font-medium">{label}</dt>
      <dd className="text-sm text-neutral-900 flex-1">{value}</dd>
    </div>
  )
}

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <dl className="bg-neutral-50 rounded-lg px-4 py-1">{children}</dl>
    </div>
  )
}

// ─── Step 1: Company Basics ────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  errors,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  return (
    <div className="space-y-5">
      <SectionHeader>Company Information</SectionHeader>

      {/* Company Name */}
      <div>
        <label htmlFor="company_name" className={labelClass}>
          Company name <span className="text-error">*</span>
        </label>
        <input
          id="company_name"
          type="text"
          value={data.company_name}
          onChange={(e) => onChange({ company_name: e.target.value })}
          placeholder="Acme HVAC Services"
          className={[inputClass, errors.company_name ? 'border-error focus:ring-error' : ''].join(' ')}
        />
        {errors.company_name && (
          <p className="mt-1 text-xs text-error">{errors.company_name}</p>
        )}
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number <span className="text-error">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(555) 000-0000"
            className={[inputClass, errors.phone ? 'border-error focus:ring-error' : ''].join(' ')}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-error">{errors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Business email <span className="text-error">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="contact@yourcompany.com"
            className={[inputClass, errors.email ? 'border-error focus:ring-error' : ''].join(' ')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-error">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className={labelClass}>
          Website
        </label>
        <input
          id="website"
          type="url"
          value={data.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://www.yourcompany.com"
          className={inputClass}
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="street_address" className={labelClass}>
          Street address
        </label>
        <input
          id="street_address"
          type="text"
          value={data.street_address}
          onChange={(e) => onChange({ street_address: e.target.value })}
          placeholder="123 Main St"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <label htmlFor="city" className={labelClass}>
            City <span className="text-error">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Chicago"
            className={[inputClass, errors.city ? 'border-error focus:ring-error' : ''].join(' ')}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-error">{errors.city}</p>
          )}
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>
            State <span className="text-error">*</span>
          </label>
          <select
            id="state"
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className={[inputClass, errors.state ? 'border-error focus:ring-error' : ''].join(' ')}
          >
            <option value="">—</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.abbr}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-xs text-error">{errors.state}</p>
          )}
        </div>
        <div>
          <label htmlFor="zip_code" className={labelClass}>
            ZIP
          </label>
          <input
            id="zip_code"
            type="text"
            inputMode="numeric"
            value={data.zip_code}
            onChange={(e) => onChange({ zip_code: e.target.value })}
            placeholder="60601"
            className={inputClass}
          />
        </div>
      </div>

      {/* Year + License */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="year_established" className={labelClass}>
            Year established
          </label>
          <input
            id="year_established"
            type="number"
            inputMode="numeric"
            value={data.year_established}
            onChange={(e) => onChange({ year_established: e.target.value })}
            placeholder="2005"
            min={1900}
            max={new Date().getFullYear()}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="license_number" className={labelClass}>
            License number
          </label>
          <input
            id="license_number"
            type="text"
            value={data.license_number}
            onChange={(e) => onChange({ license_number: e.target.value })}
            placeholder="HVAC-123456"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Commercial Capabilities ──────────────────────────────────────────

function Step2({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  function toggleArray(field: 'system_types' | 'building_types_served' | 'brands_serviced' | 'services_offered', value: string) {
    const current = data[field] as string[]
    onChange({
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    })
  }

  return (
    <div className="space-y-6">
      {/* System Types */}
      <div>
        <SectionHeader>System Types Serviced</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SYSTEM_TYPES.map((item) => (
            <CheckboxItem
              key={item.value}
              id={`system-${item.value}`}
              label={item.label}
              checked={data.system_types.includes(item.value)}
              onChange={() => toggleArray('system_types', item.value)}
            />
          ))}
        </div>
      </div>

      {/* Building Types */}
      <div>
        <SectionHeader>Building Types Served</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BUILDING_TYPES.map((item) => (
            <CheckboxItem
              key={item.value}
              id={`building-${item.value}`}
              label={item.label}
              checked={data.building_types_served.includes(item.value)}
              onChange={() => toggleArray('building_types_served', item.value)}
            />
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <SectionHeader>Brands Serviced</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HVAC_BRANDS.map((brand) => (
            <CheckboxItem
              key={brand}
              id={`brand-${brand}`}
              label={brand}
              checked={data.brands_serviced.includes(brand)}
              onChange={() => toggleArray('brands_serviced', brand)}
            />
          ))}
        </div>
      </div>

      {/* Tonnage Range */}
      <div>
        <SectionHeader>Tonnage Range</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tonnage_min" className={labelClass}>
              Minimum (tons)
            </label>
            <input
              id="tonnage_min"
              type="number"
              inputMode="numeric"
              value={data.tonnage_range_min}
              onChange={(e) => onChange({ tonnage_range_min: e.target.value })}
              placeholder="5"
              min={0}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tonnage_max" className={labelClass}>
              Maximum (tons)
            </label>
            <input
              id="tonnage_max"
              type="number"
              inputMode="numeric"
              value={data.tonnage_range_max}
              onChange={(e) => onChange({ tonnage_range_max: e.target.value })}
              placeholder="2000"
              min={0}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Services Offered */}
      <div>
        <SectionHeader>Services Offered</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HVAC_SERVICES.map((svc) => (
            <CheckboxItem
              key={svc.slug}
              id={`svc-${svc.slug}`}
              label={svc.name}
              checked={data.services_offered.includes(svc.slug)}
              onChange={() => toggleArray('services_offered', svc.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Operations & SLAs ────────────────────────────────────────────────

function Step3({
  data,
  onChange,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
}) {
  function toggleServiceAgreementType(value: string) {
    const current = data.service_agreement_types
    onChange({
      service_agreement_types: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    })
  }

  return (
    <div className="space-y-6">
      {/* Technicians */}
      <div>
        <SectionHeader>Team</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="num_technicians" className={labelClass}>
              Number of technicians
            </label>
            <input
              id="num_technicians"
              type="number"
              inputMode="numeric"
              value={data.num_technicians}
              onChange={(e) => onChange({ num_technicians: e.target.value })}
              placeholder="12"
              min={0}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="num_nate_certified" className={labelClass}>
              NATE certified technicians
            </label>
            <input
              id="num_nate_certified"
              type="number"
              inputMode="numeric"
              value={data.num_nate_certified}
              onChange={(e) => onChange({ num_nate_certified: e.target.value })}
              placeholder="6"
              min={0}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Response & Availability */}
      <div>
        <SectionHeader>Response &amp; Availability</SectionHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="emergency_response_minutes" className={labelClass}>
              Emergency response time (minutes)
            </label>
            <input
              id="emergency_response_minutes"
              type="number"
              inputMode="numeric"
              value={data.emergency_response_minutes}
              onChange={(e) => onChange({ emergency_response_minutes: e.target.value })}
              placeholder="120"
              min={0}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label htmlFor="toggle-24-7" className="text-sm font-medium text-neutral-800 block">
                24/7 availability
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">Available for emergency calls around the clock</p>
            </div>
            <Toggle
              id="toggle-24-7"
              checked={data.offers_24_7}
              onChange={(v) => onChange({ offers_24_7: v })}
            />
          </div>
        </div>
      </div>

      {/* Multi-site Coverage */}
      <div>
        <SectionHeader>Coverage</SectionHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label htmlFor="toggle-multisite" className="text-sm font-medium text-neutral-800 block">
                Multi-site coverage
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">Manages multiple properties or locations</p>
            </div>
            <Toggle
              id="toggle-multisite"
              checked={data.multi_site_coverage}
              onChange={(v) => onChange({ multi_site_coverage: v })}
            />
          </div>

          {data.multi_site_coverage && (
            <div>
              <label htmlFor="max_sites_supported" className={labelClass}>
                Maximum sites supported
              </label>
              <input
                id="max_sites_supported"
                type="number"
                inputMode="numeric"
                value={data.max_sites_supported}
                onChange={(e) => onChange({ max_sites_supported: e.target.value })}
                placeholder="50"
                min={1}
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>

      {/* Service Agreements */}
      <div>
        <SectionHeader>Service Agreements</SectionHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label htmlFor="toggle-agreements" className="text-sm font-medium text-neutral-800 block">
                Offers service agreements
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">Preventive maintenance and service contracts</p>
            </div>
            <Toggle
              id="toggle-agreements"
              checked={data.offers_service_agreements}
              onChange={(v) => onChange({ offers_service_agreements: v })}
            />
          </div>

          {data.offers_service_agreements && (
            <div>
              <p className={labelClass}>Agreement types offered</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_AGREEMENT_TYPES.map((item) => (
                  <CheckboxItem
                    key={item.value}
                    id={`sla-type-${item.value}`}
                    label={item.label}
                    checked={data.service_agreement_types.includes(item.value)}
                    onChange={() => toggleServiceAgreementType(item.value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operations */}
      <div>
        <SectionHeader>Operations</SectionHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="dispatch_crm" className={labelClass}>
              Dispatch / CRM software
            </label>
            <select
              id="dispatch_crm"
              value={data.dispatch_crm}
              onChange={(e) => onChange({ dispatch_crm: e.target.value })}
              className={inputClass}
            >
              <option value="">Select software…</option>
              {DISPATCH_CRM_OPTIONS.map((crm) => (
                <option key={crm} value={crm}>
                  {crm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div>
              <label htmlFor="toggle-gps" className="text-sm font-medium text-neutral-800 block">
                GPS vehicle tracking
              </label>
              <p className="text-xs text-neutral-500 mt-0.5">Real-time technician tracking enabled</p>
            </div>
            <Toggle
              id="toggle-gps"
              checked={data.uses_gps_tracking}
              onChange={(v) => onChange({ uses_gps_tracking: v })}
            />
          </div>

          <div>
            <label htmlFor="avg_quote_turnaround_hours" className={labelClass}>
              Average quote turnaround (hours)
            </label>
            <input
              id="avg_quote_turnaround_hours"
              type="number"
              inputMode="numeric"
              value={data.avg_quote_turnaround_hours}
              onChange={(e) => onChange({ avg_quote_turnaround_hours: e.target.value })}
              placeholder="24"
              min={0}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sla_summary" className={labelClass}>
              SLA summary
            </label>
            <textarea
              id="sla_summary"
              value={data.sla_summary}
              onChange={(e) => onChange({ sla_summary: e.target.value })}
              rows={4}
              placeholder="Describe your service level agreements, response guarantees, and uptime commitments…"
              className={inputClass}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Description & Review ────────────────────────────────────────────

function Step4({
  data,
  onChange,
  errors,
}: {
  data: FormData
  onChange: (patch: Partial<FormData>) => void
  errors: Partial<Record<keyof FormData, string>>
}) {
  const charCount = data.short_description.length

  // Helpers for review display
  const getSystemLabels = () =>
    SYSTEM_TYPES.filter((s) => data.system_types.includes(s.value))
      .map((s) => s.label)
      .join(', ') || '—'

  const getBuildingLabels = () =>
    BUILDING_TYPES.filter((b) => data.building_types_served.includes(b.value))
      .map((b) => b.label)
      .join(', ') || '—'

  const getServiceLabels = () =>
    HVAC_SERVICES.filter((s) => data.services_offered.includes(s.slug))
      .map((s) => s.name)
      .join(', ') || '—'

  const getAgreementLabels = () =>
    SERVICE_AGREEMENT_TYPES.filter((a) => data.service_agreement_types.includes(a.value))
      .map((a) => a.label)
      .join(', ') || '—'

  return (
    <div className="space-y-6">
      {/* Description inputs */}
      <div>
        <SectionHeader>Company Description</SectionHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="description" className="text-sm font-medium text-neutral-700">
                Full description
              </label>
              <span className="text-xs text-neutral-400">
                {data.description.length > 0
                  ? `${data.description.length} chars${data.description.length < 500 ? ' (500+ recommended)' : ''}`
                  : '500+ chars recommended'}
              </span>
            </div>
            <textarea
              id="description"
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={6}
              placeholder="Describe your company's expertise, history, specializations, and what sets you apart in commercial HVAC…"
              className={inputClass}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="short_description" className="text-sm font-medium text-neutral-700">
                Short description
              </label>
              <span
                className={[
                  'text-xs',
                  charCount > 160 ? 'text-error' : charCount > 140 ? 'text-warning' : 'text-neutral-400',
                ].join(' ')}
              >
                {charCount}/160
              </span>
            </div>
            <textarea
              id="short_description"
              value={data.short_description}
              onChange={(e) =>
                onChange({ short_description: e.target.value.slice(0, 160) })
              }
              rows={3}
              maxLength={160}
              placeholder="One-sentence summary shown in search results…"
              className={[inputClass, errors.short_description ? 'border-error focus:ring-error' : ''].join(' ')}
              style={{ resize: 'vertical' }}
            />
            {errors.short_description && (
              <p className="mt-1 text-xs text-error">{errors.short_description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Review summary */}
      <div>
        <SectionHeader>Review Your Information</SectionHeader>
        <p className="text-sm text-neutral-500 mb-4">
          Please review your details before submitting. You can go back to edit any section.
        </p>

        <ReviewSection title="Company Basics">
          <ReviewRow label="Company name" value={data.company_name || '—'} />
          <ReviewRow label="Phone" value={data.phone || '—'} />
          <ReviewRow label="Email" value={data.email || '—'} />
          <ReviewRow label="Website" value={data.website || '—'} />
          <ReviewRow
            label="Address"
            value={
              [data.street_address, data.city, data.state, data.zip_code]
                .filter(Boolean)
                .join(', ') || '—'
            }
          />
          <ReviewRow label="Year established" value={data.year_established || '—'} />
          <ReviewRow label="License number" value={data.license_number || '—'} />
        </ReviewSection>

        <ReviewSection title="Capabilities">
          <ReviewRow label="System types" value={getSystemLabels()} />
          <ReviewRow label="Building types" value={getBuildingLabels()} />
          <ReviewRow
            label="Brands"
            value={data.brands_serviced.length > 0 ? data.brands_serviced.join(', ') : '—'}
          />
          <ReviewRow
            label="Tonnage range"
            value={
              data.tonnage_range_min || data.tonnage_range_max
                ? `${data.tonnage_range_min || '?'} – ${data.tonnage_range_max || '?'} tons`
                : '—'
            }
          />
          <ReviewRow label="Services" value={getServiceLabels()} />
        </ReviewSection>

        <ReviewSection title="Operations">
          <ReviewRow label="Technicians" value={data.num_technicians || '—'} />
          <ReviewRow label="NATE certified" value={data.num_nate_certified || '—'} />
          <ReviewRow
            label="Emergency response"
            value={data.emergency_response_minutes ? `${data.emergency_response_minutes} min` : '—'}
          />
          <ReviewRow label="24/7 availability" value={data.offers_24_7 ? 'Yes' : 'No'} />
          <ReviewRow
            label="Multi-site coverage"
            value={
              data.multi_site_coverage
                ? `Yes${data.max_sites_supported ? ` (max ${data.max_sites_supported} sites)` : ''}`
                : 'No'
            }
          />
          <ReviewRow
            label="Service agreements"
            value={data.offers_service_agreements ? getAgreementLabels() : 'No'}
          />
          <ReviewRow label="Dispatch CRM" value={data.dispatch_crm || '—'} />
          <ReviewRow label="GPS tracking" value={data.uses_gps_tracking ? 'Yes' : 'No'} />
          <ReviewRow
            label="Quote turnaround"
            value={
              data.avg_quote_turnaround_hours ? `${data.avg_quote_turnaround_hours} hrs` : '—'
            }
          />
        </ReviewSection>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Auth guard — redirect to /signup if not authenticated
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/signup')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  function update(patch: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...patch }))
    // Clear errors for updated fields
    const clearedErrors: Partial<Record<keyof FormData, string>> = { ...errors }
    for (const key of Object.keys(patch) as (keyof FormData)[]) {
      delete clearedErrors[key]
    }
    setErrors(clearedErrors)
  }

  function validateStep(step: number): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 1) {
      if (!formData.company_name.trim()) {
        newErrors.company_name = 'Company name is required'
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Business email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address'
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required'
      }
      if (!formData.state) {
        newErrors.state = 'State is required'
      }
    }

    if (step === 4) {
      if (formData.short_description.length > 160) {
        newErrors.short_description = 'Short description cannot exceed 160 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validateStep(currentStep)) return
    setCurrentStep((s) => Math.min(s + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!validateStep(4)) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/contractors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (!res.ok) {
        setSubmitError(json.error || 'Registration failed. Please try again.')
        setSubmitting(false)
        return
      }

      router.push('/dashboard?registered=1')
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Page title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 font-display">
          Register Your Company
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Create your free contractor profile on My HVAC Tech
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {currentStep === 1 && (
          <Step1 data={formData} onChange={update} errors={errors} />
        )}
        {currentStep === 2 && (
          <Step2 data={formData} onChange={update} />
        )}
        {currentStep === 3 && (
          <Step3 data={formData} onChange={update} />
        )}
        {currentStep === 4 && (
          <Step4 data={formData} onChange={update} errors={errors} />
        )}

        {/* Submit error */}
        {submitError && (
          <div
            role="alert"
            className="mt-4 text-sm text-error bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-100 pt-6">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" size="md" onClick={handleBack} type="button">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 hidden sm:block">
              Step {currentStep} of 4
            </span>
            {currentStep < 4 ? (
              <Button variant="primary" size="md" onClick={handleNext} type="button">
                Next
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                loading={submitting}
                type="button"
              >
                Submit Registration
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
