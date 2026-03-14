'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle, Building2, Zap } from 'lucide-react'
import {
  BUILDING_TYPES,
  SYSTEM_TYPES,
  SERVICE_TYPES,
  BUDGET_BANDS,
  TIMING_OPTIONS,
  US_STATES,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

// ─── Metadata (exported separately for server metadata, page is 'use client') ──
// See metadata export at bottom

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuoteFormData {
  // Step 1: Property Details
  building_type: string
  property_sqft: string
  num_buildings: string
  num_units_rtus: string
  system_types: string[]

  // Step 2: Service Needed
  service_type: string
  current_issues: string
  budget_band: string
  timing: string

  // Step 3: Your Information
  requestor_name: string
  requestor_email: string
  requestor_phone: string
  requestor_title: string
  company_name: string
  property_city: string
  property_state: string
  property_zip: string
}

const INITIAL_FORM: QuoteFormData = {
  building_type: '',
  property_sqft: '',
  num_buildings: '1',
  num_units_rtus: '',
  system_types: [],
  service_type: '',
  current_issues: '',
  budget_band: '',
  timing: '',
  requestor_name: '',
  requestor_email: '',
  requestor_phone: '',
  requestor_title: '',
  company_name: '',
  property_city: '',
  property_state: '',
  property_zip: '',
}

const STEP_LABELS = ['Property Details', 'Service Needed', 'Your Information', 'Confirm & Submit']

// ─── Helper: Toggle multi-select ─────────────────────────────────────────────

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputBase =
  'w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'

const labelBase = 'block text-xs font-medium text-neutral-700 mb-1.5'

const radioCardBase = cn(
  'relative flex flex-col px-3.5 py-3 rounded-lg border cursor-pointer transition-colors text-left',
  'hover:border-primary-300'
)

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      {/* Step labels (desktop) */}
      <div className="hidden sm:flex items-center mb-3">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  i + 1 < step
                    ? 'bg-primary-500 text-white'
                    : i + 1 === step
                    ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                    : 'bg-neutral-100 text-neutral-400'
                )}
              >
                {i + 1 < step ? <CheckCircle size={14} aria-hidden="true" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[11px] font-medium whitespace-nowrap',
                  i + 1 === step ? 'text-primary-600' : 'text-neutral-400'
                )}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 rounded transition-colors mb-4',
                  i + 1 < step ? 'bg-primary-500' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: compact progress */}
      <div className="sm:hidden mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-neutral-500">
            Step {step} of {total}
          </span>
          <span className="text-xs font-semibold text-primary-600">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-100 rounded-full">
          <div
            className="h-1.5 bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Property Details ─────────────────────────────────────────────────

function Step1({
  form,
  setField,
  touched,
  setTouched,
}: {
  form: QuoteFormData
  setField: <K extends keyof QuoteFormData>(k: K, v: QuoteFormData[K]) => void
  touched: Set<string>
  setTouched: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Tell us about your property</h2>
        <p className="text-sm text-neutral-500">
          We use this to match you with contractors who specialize in your building type and systems.
        </p>
      </div>

      {/* Building type */}
      <div>
        <label className={labelBase}>
          Building Type <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BUILDING_TYPES.map((bt) => (
            <label
              key={bt.value}
              className={cn(
                radioCardBase,
                form.building_type === bt.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white',
                touched.has('building_type') && !form.building_type ? 'border-red-300' : ''
              )}
            >
              <input
                type="radio"
                name="building_type"
                value={bt.value}
                checked={form.building_type === bt.value}
                onChange={() => {
                  setField('building_type', bt.value)
                  setTouched((p) => new Set(p).add('building_type'))
                }}
                className="sr-only"
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  form.building_type === bt.value ? 'text-primary-700' : 'text-neutral-700'
                )}
              >
                {bt.label}
              </span>
            </label>
          ))}
        </div>
        {touched.has('building_type') && !form.building_type && (
          <p className="text-xs text-red-600 mt-1">Please select a building type</p>
        )}
      </div>

      {/* Sq ft + num buildings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sq-property_sqft" className={labelBase}>
            Total Sq Ft (approx.)
          </label>
          <input
            id="sq-property_sqft"
            type="number"
            min="0"
            placeholder="e.g. 45000"
            value={form.property_sqft}
            onChange={(e) => setField('property_sqft', e.target.value)}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="sq-num_buildings" className={labelBase}>
            Number of Buildings
          </label>
          <input
            id="sq-num_buildings"
            type="number"
            min="1"
            placeholder="1"
            value={form.num_buildings}
            onChange={(e) => setField('num_buildings', e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      {/* RTUs */}
      <div>
        <label htmlFor="sq-num_units_rtus" className={labelBase}>
          Number of RTUs / Major Units (approx.)
        </label>
        <input
          id="sq-num_units_rtus"
          type="number"
          min="0"
          placeholder="e.g. 12"
          value={form.num_units_rtus}
          onChange={(e) => setField('num_units_rtus', e.target.value)}
          className={inputBase}
        />
      </div>

      {/* System types */}
      <div>
        <label className={labelBase}>System Types Installed (select all that apply)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SYSTEM_TYPES.map((st) => (
            <label key={st.value} className="flex items-center gap-2.5 cursor-pointer group py-1">
              <input
                type="checkbox"
                checked={form.system_types.includes(st.value)}
                onChange={() => setField('system_types', toggleItem(form.system_types, st.value))}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{st.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Service Needed ───────────────────────────────────────────────────

function Step2({
  form,
  setField,
  touched,
  setTouched,
}: {
  form: QuoteFormData
  setField: <K extends keyof QuoteFormData>(k: K, v: QuoteFormData[K]) => void
  touched: Set<string>
  setTouched: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">What service do you need?</h2>
        <p className="text-sm text-neutral-500">
          Be as specific as you can. More detail helps contractors respond with accurate quotes.
        </p>
      </div>

      {/* Service type */}
      <div>
        <label className={labelBase}>
          Service Type <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="space-y-2">
          {SERVICE_TYPES.map((st) => (
            <label
              key={st.value}
              className={cn(
                radioCardBase,
                'flex-row items-center gap-3',
                form.service_type === st.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white',
                touched.has('service_type') && !form.service_type ? 'border-red-300' : ''
              )}
            >
              <input
                type="radio"
                name="service_type"
                value={st.value}
                checked={form.service_type === st.value}
                onChange={() => {
                  setField('service_type', st.value)
                  setTouched((p) => new Set(p).add('service_type'))
                }}
                className="w-4 h-4 border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500 shrink-0"
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  form.service_type === st.value ? 'text-primary-700' : 'text-neutral-700'
                )}
              >
                {st.label}
              </span>
            </label>
          ))}
        </div>
        {touched.has('service_type') && !form.service_type && (
          <p className="text-xs text-red-600 mt-1">Please select a service type</p>
        )}
      </div>

      {/* Current issues */}
      <div>
        <label htmlFor="sq-current_issues" className={labelBase}>
          Describe the Issue or Project
        </label>
        <textarea
          id="sq-current_issues"
          rows={4}
          placeholder="Describe what's happening — compressor failure, no cooling on 3rd floor, aging equipment, etc."
          value={form.current_issues}
          onChange={(e) => setField('current_issues', e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>

      {/* Budget band */}
      <div>
        <label className={labelBase}>Estimated Budget</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BUDGET_BANDS.map((bb) => (
            <label
              key={bb.value}
              className={cn(
                radioCardBase,
                'flex-row items-center gap-3',
                form.budget_band === bb.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white'
              )}
            >
              <input
                type="radio"
                name="budget_band"
                value={bb.value}
                checked={form.budget_band === bb.value}
                onChange={() => setField('budget_band', bb.value)}
                className="w-4 h-4 border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500 shrink-0"
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  form.budget_band === bb.value ? 'text-primary-700' : 'text-neutral-700'
                )}
              >
                {bb.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div>
        <label className={labelBase}>When do you need this done?</label>
        <div className="space-y-2">
          {TIMING_OPTIONS.map((to) => (
            <label
              key={to.value}
              className={cn(
                radioCardBase,
                'flex-row items-start gap-3',
                form.timing === to.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white',
                to.value === 'emergency_now' && form.timing === to.value
                  ? 'border-red-500 bg-red-50'
                  : ''
              )}
            >
              <input
                type="radio"
                name="timing"
                value={to.value}
                checked={form.timing === to.value}
                onChange={() => setField('timing', to.value)}
                className="w-4 h-4 mt-0.5 border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500 shrink-0"
              />
              <div>
                <span
                  className={cn(
                    'text-sm font-medium block',
                    form.timing === to.value && to.value !== 'emergency_now'
                      ? 'text-primary-700'
                      : form.timing === to.value && to.value === 'emergency_now'
                      ? 'text-red-700'
                      : 'text-neutral-700'
                  )}
                >
                  {to.label}
                </span>
                <span className="text-xs text-neutral-500 mt-0.5">{to.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Your Information ─────────────────────────────────────────────────

function Step3({
  form,
  setField,
  touched,
  setTouched,
}: {
  form: QuoteFormData
  setField: <K extends keyof QuoteFormData>(k: K, v: QuoteFormData[K]) => void
  touched: Set<string>
  setTouched: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Your contact information</h2>
        <p className="text-sm text-neutral-500">
          Contractors will use this to send you quotes. We never share your info with non-vetted parties.
        </p>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sq-name" className={labelBase}>
            Your Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="sq-name"
            type="text"
            required
            placeholder="Jane Smith"
            value={form.requestor_name}
            onChange={(e) => setField('requestor_name', e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add('requestor_name'))}
            className={cn(
              inputBase,
              touched.has('requestor_name') && !form.requestor_name.trim()
                ? 'border-red-300 focus:ring-red-500'
                : ''
            )}
          />
          {touched.has('requestor_name') && !form.requestor_name.trim() && (
            <p className="text-xs text-red-600 mt-1">Name is required</p>
          )}
        </div>
        <div>
          <label htmlFor="sq-email" className={labelBase}>
            Work Email <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="sq-email"
            type="email"
            required
            placeholder="jane@company.com"
            value={form.requestor_email}
            onChange={(e) => setField('requestor_email', e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add('requestor_email'))}
            className={cn(
              inputBase,
              touched.has('requestor_email') && !form.requestor_email.trim()
                ? 'border-red-300 focus:ring-red-500'
                : ''
            )}
          />
          {touched.has('requestor_email') && !form.requestor_email.trim() && (
            <p className="text-xs text-red-600 mt-1">Email is required</p>
          )}
        </div>
      </div>

      {/* Phone + Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sq-phone" className={labelBase}>
            Phone Number
          </label>
          <input
            id="sq-phone"
            type="tel"
            placeholder="(602) 555-0100"
            value={form.requestor_phone}
            onChange={(e) => setField('requestor_phone', e.target.value)}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="sq-title" className={labelBase}>
            Title / Role
          </label>
          <input
            id="sq-title"
            type="text"
            placeholder="Facility Manager, Property Director…"
            value={form.requestor_title}
            onChange={(e) => setField('requestor_title', e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label htmlFor="sq-company" className={labelBase}>
          Company Name
        </label>
        <input
          id="sq-company"
          type="text"
          placeholder="Acme Properties LLC"
          value={form.company_name}
          onChange={(e) => setField('company_name', e.target.value)}
          className={inputBase}
        />
      </div>

      {/* City / State / Zip */}
      <div>
        <label className={labelBase}>Property Location</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <input
              type="text"
              placeholder="City"
              value={form.property_city}
              onChange={(e) => setField('property_city', e.target.value)}
              className={inputBase}
              aria-label="Property city"
            />
          </div>
          <div>
            <select
              value={form.property_state}
              onChange={(e) => setField('property_state', e.target.value)}
              className={inputBase}
              aria-label="Property state"
            >
              <option value="">State</option>
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.abbr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="ZIP"
              maxLength={10}
              value={form.property_zip}
              onChange={(e) => setField('property_zip', e.target.value)}
              className={inputBase}
              aria-label="Property ZIP code"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Confirmation ─────────────────────────────────────────────────────

function Step4({
  form,
  loading,
  error,
}: {
  form: QuoteFormData
  loading: boolean
  error: string | null
}) {
  const buildingLabel =
    BUILDING_TYPES.find((b) => b.value === form.building_type)?.label ?? form.building_type
  const serviceLabel =
    SERVICE_TYPES.find((s) => s.value === form.service_type)?.label ?? form.service_type
  const budgetLabel =
    BUDGET_BANDS.find((b) => b.value === form.budget_band)?.label ?? form.budget_band
  const timingLabel =
    TIMING_OPTIONS.find((t) => t.value === form.timing)?.label ?? form.timing
  const systemLabels = form.system_types
    .map((sv) => SYSTEM_TYPES.find((st) => st.value === sv)?.label ?? sv)
    .join(', ')

  const SummaryRow = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
        <span className="text-xs font-medium text-neutral-500 w-36 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-neutral-800 font-medium">{value}</span>
      </div>
    ) : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Review your request</h2>
        <p className="text-sm text-neutral-500">
          We&apos;ll match you with 2–3 vetted commercial HVAC contractors in your area.
          Expect responses within 4 hours.
        </p>
      </div>

      {/* Property summary */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-1">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide py-2.5 border-b border-neutral-100">
          Property Details
        </p>
        <SummaryRow label="Building Type" value={buildingLabel} />
        <SummaryRow
          label="Size"
          value={form.property_sqft ? `${parseInt(form.property_sqft).toLocaleString()} sq ft` : ''}
        />
        <SummaryRow
          label="Buildings"
          value={form.num_buildings ? `${form.num_buildings} building(s)` : ''}
        />
        <SummaryRow
          label="RTUs / Units"
          value={form.num_units_rtus ? `${form.num_units_rtus} unit(s)` : ''}
        />
        <SummaryRow label="System Types" value={systemLabels} />
      </div>

      {/* Service summary */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-1">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide py-2.5 border-b border-neutral-100">
          Service Details
        </p>
        <SummaryRow label="Service Needed" value={serviceLabel} />
        <SummaryRow label="Budget" value={budgetLabel} />
        <SummaryRow label="Timing" value={timingLabel} />
        {form.current_issues && (
          <div className="flex items-start gap-3 py-2.5">
            <span className="text-xs font-medium text-neutral-500 w-36 shrink-0 pt-0.5">Issue Description</span>
            <span className="text-sm text-neutral-800">{form.current_issues}</span>
          </div>
        )}
      </div>

      {/* Contact summary */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 px-4 py-1">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide py-2.5 border-b border-neutral-100">
          Your Information
        </p>
        <SummaryRow label="Name" value={form.requestor_name} />
        <SummaryRow label="Email" value={form.requestor_email} />
        <SummaryRow label="Phone" value={form.requestor_phone} />
        <SummaryRow label="Title" value={form.requestor_title} />
        <SummaryRow label="Company" value={form.company_name} />
        <SummaryRow
          label="Location"
          value={
            [form.property_city, form.property_state, form.property_zip]
              .filter(Boolean)
              .join(', ')
          }
        />
      </div>

      {/* What happens next */}
      <div className="bg-primary-50 rounded-xl border border-primary-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={15} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900 mb-1">What happens next?</p>
            <ul className="space-y-1 text-sm text-primary-800">
              <li>We&apos;ll match you with 2–3 vetted commercial HVAC contractors in your area.</li>
              <li>Each contractor is verified for commercial experience and insurance.</li>
              <li>Expect responses within 4 hours during business hours.</li>
              <li>You&apos;ll be notified by email as contractors respond.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading feedback */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 size={16} className="animate-spin text-primary-500" aria-hidden="true" />
          Submitting your request…
        </div>
      )}
    </div>
  )
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ city, email }: { city: string; email: string }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <CheckCircle size={32} className="text-green-600" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">Your request has been sent!</h2>
      <p className="text-sm text-neutral-600 max-w-sm mb-6">
        Your request has been sent to vetted contractors
        {city ? ` in ${city}` : ' in your area'}.
        We&apos;ll notify you at <span className="font-medium text-neutral-800">{email}</span> as contractors respond.
      </p>

      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-left">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-primary-600 text-xs font-bold">1</div>
          <div>
            <p className="text-sm font-medium text-neutral-800">Matching underway</p>
            <p className="text-xs text-neutral-500">We&apos;re identifying the best-fit contractors now.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-left">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-primary-600 text-xs font-bold">2</div>
          <div>
            <p className="text-sm font-medium text-neutral-800">Quotes within 4 hours</p>
            <p className="text-xs text-neutral-500">Each contractor will receive your full property brief.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-left">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-primary-600 text-xs font-bold">3</div>
          <div>
            <p className="text-sm font-medium text-neutral-800">You choose</p>
            <p className="text-xs text-neutral-500">Compare quotes and pick the contractor that fits.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/search"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
        >
          Browse Contractors
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function GetQuotesPage() {
  const [step, setStep] = useState(1)
  const [form, setFormState] = useState<QuoteFormData>(INITIAL_FORM)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const TOTAL_STEPS = 4

  const setField = <K extends keyof QuoteFormData>(key: K, value: QuoteFormData[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.building_type) {
        setTouched((p) => new Set(p).add('building_type'))
        return 'Please select a building type.'
      }
    }
    if (s === 2) {
      if (!form.service_type) {
        setTouched((p) => new Set(p).add('service_type'))
        return 'Please select a service type.'
      }
    }
    if (s === 3) {
      const missing: string[] = []
      if (!form.requestor_name.trim()) {
        setTouched((p) => new Set(p).add('requestor_name'))
        missing.push('name')
      }
      if (!form.requestor_email.trim()) {
        setTouched((p) => new Set(p).add('requestor_email'))
        missing.push('email')
      }
      if (
        form.requestor_email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requestor_email)
      ) {
        return 'Please enter a valid email address.'
      }
      if (missing.length > 0) {
        return `Please fill in your ${missing.join(' and ')}.`
      }
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setError(null)
    setStep((s) => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        building_type: form.building_type,
        property_sqft: form.property_sqft ? parseInt(form.property_sqft) : null,
        num_buildings: parseInt(form.num_buildings) || 1,
        num_units_rtus: form.num_units_rtus ? parseInt(form.num_units_rtus) : null,
        system_types: form.system_types,
        service_type: form.service_type,
        current_issues: form.current_issues || null,
        budget_band: form.budget_band || null,
        timing: form.timing || null,
        requestor_name: form.requestor_name,
        requestor_email: form.requestor_email,
        requestor_phone: form.requestor_phone || null,
        requestor_title: form.requestor_title || null,
        company_name: form.company_name || null,
        property_city: form.property_city || null,
        property_state: form.property_state || null,
        property_zip: form.property_zip || null,
        source: 'get_quotes_page',
      }

      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }

      setSubmitted(true)
      trackEvent('quote_request_submitted', {
        building_type: form.building_type,
        service_type: form.service_type,
        timing: form.timing || 'not_specified',
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-neutral-900 hover:text-primary-600 transition-colors">
            <Building2 size={20} className="text-primary-500" aria-hidden="true" />
            <span className="font-semibold text-sm">My HVAC Tech</span>
          </Link>
          <Link
            href="/search"
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Browse Contractors
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {submitted ? (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
            <SuccessState city={form.property_city} email={form.requestor_email} />
          </div>
        ) : (
          <>
            {/* Intro */}
            {step === 1 && (
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                  Get Free Quotes from Vetted Commercial HVAC Contractors
                </h1>
                <p className="text-sm text-neutral-500 max-w-lg mx-auto">
                  Describe your property and HVAC needs. We&apos;ll match you with 2–3 vetted commercial
                  contractors in your area. Free for property and facility managers.
                </p>
              </div>
            )}

            {/* Form card */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-7">
              <ProgressBar step={step} total={TOTAL_STEPS} />

              {/* Step content */}
              {step === 1 && (
                <Step1
                  form={form}
                  setField={setField}
                  touched={touched}
                  setTouched={setTouched}
                />
              )}
              {step === 2 && (
                <Step2
                  form={form}
                  setField={setField}
                  touched={touched}
                  setTouched={setTouched}
                />
              )}
              {step === 3 && (
                <Step3
                  form={form}
                  setField={setField}
                  touched={touched}
                  setTouched={setTouched}
                />
              )}
              {step === 4 && (
                <Step4
                  form={form}
                  loading={loading}
                  error={error}
                />
              )}

              {/* Step-level error (steps 1-3) */}
              {error && step < 4 && (
                <div className="flex items-start gap-2 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-7 pt-5 border-t border-neutral-100">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Cancel
                  </Link>
                )}

                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Request
                        <ChevronRight size={16} aria-hidden="true" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Trust note */}
            <p className="text-center text-xs text-neutral-400 mt-4">
              Free for property and facility managers. No spam — ever.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
