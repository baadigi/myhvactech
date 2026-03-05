'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { HVAC_SERVICES, BUILDING_TYPES, SYSTEM_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SearchFiltersProps {
  selectedCategories?: string[]
  minRating?: number
  verifiedOnly?: boolean
  emergencyOnly?: boolean
  radius?: number
  // Commercial-specific props
  selectedBuildingTypes?: string[]
  selectedSystemTypes?: string[]
  tonnageMin?: number | null
  tonnageMax?: number | null
  serviceAgreement?: boolean
  multiSite?: boolean
}

const RATING_OPTIONS = [
  { label: 'Any rating', value: 0 },
  { label: '4+ stars', value: 4 },
  { label: '4.5+ stars', value: 4.5 },
]

const RADIUS_OPTIONS = [
  { label: '10 miles', value: 10 },
  { label: '25 miles', value: 25 },
  { label: '50 miles', value: 50 },
  { label: '100 miles', value: 100 },
]

const SERVICE_CATEGORIES = ['Installation', 'Repair', 'Maintenance', 'Emergency']

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {description && <p className="text-xs text-neutral-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0',
          checked ? 'bg-primary-500' : 'bg-neutral-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

const Divider = () => <div className="h-px bg-neutral-200" />

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchFilters({
  selectedCategories: initialCategories = [],
  minRating: initialMinRating = 0,
  verifiedOnly: initialVerified = false,
  emergencyOnly: initialEmergency = false,
  radius: initialRadius = 25,
  selectedBuildingTypes: initialBuildingTypes = [],
  selectedSystemTypes: initialSystemTypes = [],
  tonnageMin: initialTonnageMin = null,
  tonnageMax: initialTonnageMax = null,
  serviceAgreement: initialServiceAgreement = false,
  multiSite: initialMultiSite = false,
}: SearchFiltersProps) {
  // ── Existing state ──────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [minRating, setMinRating] = useState(initialMinRating)
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified)
  const [emergencyOnly, setEmergencyOnly] = useState(initialEmergency)
  const [radius, setRadius] = useState(initialRadius)
  const [mobileOpen, setMobileOpen] = useState(false)

  // ── Commercial-specific state ───────────────────────────────────────────────
  const [buildingTypes, setBuildingTypes] = useState<string[]>(initialBuildingTypes)
  const [systemTypes, setSystemTypes] = useState<string[]>(initialSystemTypes)
  const [tonnageMin, setTonnageMin] = useState<string>(
    initialTonnageMin != null ? String(initialTonnageMin) : ''
  )
  const [tonnageMax, setTonnageMax] = useState<string>(
    initialTonnageMax != null ? String(initialTonnageMax) : ''
  )
  const [serviceAgreement, setServiceAgreement] = useState(initialServiceAgreement)
  const [multiSite, setMultiSite] = useState(initialMultiSite)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleBuildingType = (val: string) => {
    setBuildingTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  const toggleSystemType = (val: string) => {
    setSystemTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  // Count active commercial filters (for mobile badge)
  const commercialFilterCount =
    buildingTypes.length +
    systemTypes.length +
    (tonnageMin ? 1 : 0) +
    (tonnageMax ? 1 : 0) +
    (serviceAgreement ? 1 : 0) +
    (multiSite ? 1 : 0)

  const totalFilterCount =
    categories.length +
    (minRating > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (emergencyOnly ? 1 : 0) +
    commercialFilterCount

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setCategories([])
    setMinRating(0)
    setVerifiedOnly(false)
    setEmergencyOnly(false)
    setRadius(25)
    setBuildingTypes([])
    setSystemTypes([])
    setTonnageMin('')
    setTonnageMax('')
    setServiceAgreement(false)
    setMultiSite(false)
  }

  // ── Filter content (shared between desktop and mobile) ──────────────────────

  const FilterContent = () => (
    <div className="space-y-5">

      {/* ── Building Type (NEW — at top) ─────────────────────────────────── */}
      <FilterSection title="Building Type">
        <div className="space-y-1.5">
          {BUILDING_TYPES.map((bt) => (
            <label key={bt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={buildingTypes.includes(bt.value)}
                onChange={() => toggleBuildingType(bt.value)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                {bt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Divider />

      {/* ── System Type (NEW) ────────────────────────────────────────────── */}
      <FilterSection title="System Type">
        <div className="space-y-1.5">
          {SYSTEM_TYPES.map((st) => (
            <label key={st.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={systemTypes.includes(st.value)}
                onChange={() => toggleSystemType(st.value)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                {st.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Divider />

      {/* ── Tonnage Range (NEW) ──────────────────────────────────────────── */}
      <FilterSection title="Tonnage Range">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label htmlFor="sf-tonnage-min" className="sr-only">
              Minimum tonnage
            </label>
            <input
              id="sf-tonnage-min"
              type="number"
              min="1"
              placeholder="Min"
              value={tonnageMin}
              onChange={(e) => setTonnageMin(e.target.value)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <span className="text-neutral-400 text-xs">–</span>
          <div className="flex-1">
            <label htmlFor="sf-tonnage-max" className="sr-only">
              Maximum tonnage
            </label>
            <input
              id="sf-tonnage-max"
              type="number"
              min="1"
              placeholder="Max"
              value={tonnageMax}
              onChange={(e) => setTonnageMax(e.target.value)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <span className="text-xs text-neutral-500 whitespace-nowrap">tons</span>
        </div>
      </FilterSection>

      <Divider />

      {/* ── Service Category ─────────────────────────────────────────────── */}
      <FilterSection title="Service Category">
        <div className="space-y-1.5">
          {SERVICE_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Divider />

      {/* ── Minimum Rating ───────────────────────────────────────────────── */}
      <FilterSection title="Minimum Rating">
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="min-rating"
                checked={minRating === opt.value}
                onChange={() => setMinRating(opt.value)}
                className="w-4 h-4 border-neutral-300 text-primary-500 focus:ring-primary-500 accent-primary-500"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <Divider />

      {/* ── Search Radius ────────────────────────────────────────────────── */}
      <FilterSection title="Search Radius">
        <select
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterSection>

      <Divider />

      {/* ── Toggles ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <ToggleSwitch
          label="Verified Only"
          description="License &amp; insurance confirmed"
          checked={verifiedOnly}
          onChange={() => setVerifiedOnly(!verifiedOnly)}
        />

        {/* 24/7 Emergency Response (renamed) */}
        <ToggleSwitch
          label="24/7 Emergency Response"
          description="Available around the clock"
          checked={emergencyOnly}
          onChange={() => setEmergencyOnly(!emergencyOnly)}
        />

        {/* Offers Service Agreements (NEW) */}
        <ToggleSwitch
          label="Offers Service Agreements"
          description="Preventive maintenance contracts"
          checked={serviceAgreement}
          onChange={() => setServiceAgreement(!serviceAgreement)}
        />

        {/* Multi-Site Coverage (NEW) */}
        <ToggleSwitch
          label="Multi-Site Coverage"
          description="Manages multiple properties"
          checked={multiSite}
          onChange={() => setMultiSite(!multiSite)}
        />
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={handleReset}
        className="w-full text-sm text-neutral-500 hover:text-neutral-700 underline underline-offset-2 transition-colors"
      >
        Reset filters
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-neutral-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
          {totalFilterCount > 0 && (
            <span className="ml-auto bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalFilterCount}
            </span>
          )}
        </div>
        <FilterContent />
      </div>

      {/* Mobile collapsible */}
      <div className="lg:hidden bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-900"
          aria-expanded={mobileOpen}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-neutral-500" aria-hidden="true" />
            Filters
            {totalFilterCount > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalFilterCount}
              </span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn('text-neutral-400 transition-transform', mobileOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {mobileOpen && (
          <div className="px-4 pb-4 border-t border-neutral-100">
            <div className="pt-4">
              <FilterContent />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
