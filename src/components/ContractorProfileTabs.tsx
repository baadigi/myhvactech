'use client'

import { useState } from 'react'
import {
  MapPin, Clock, Shield, Camera, Building2, Thermometer,
  Wrench, Zap, Settings, Wind, CheckCircle, ChevronRight,
  AlertTriangle, ClipboardList, Cpu, Users, BarChart2,
  HeartPulse, Store, Factory, GraduationCap, Bed, Server,
  Landmark, Utensils, Layers, Timer
} from 'lucide-react'
import type { Contractor, Review, SampleProject } from '@/lib/types'
import { BUILDING_TYPES, SYSTEM_TYPES, SERVICE_AGREEMENT_TYPES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import RatingStars from '@/components/RatingStars'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import MapEmbed from '@/components/MapEmbed'

type Tab = 'overview' | 'services' | 'reviews' | 'projects' | 'photos'

interface Props {
  contractor: Contractor & { reviews?: Review[] }
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Normalize operating hours keys to title case for consistent lookup
function normalizeHoursKeys(
  hours: Record<string, { open: string; close: string }> | null
): Record<string, { open: string; close: string }> | null {
  if (!hours) return null
  const normalized: Record<string, { open: string; close: string }> = {}
  for (const [key, val] of Object.entries(hours)) {
    // Convert "monday" → "Monday" or keep "Monday" as-is
    const titleKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
    normalized[titleKey] = val
  }
  return normalized
}

function formatHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function getTodayKey(): string {
  return DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'commercial-ac-repair': <Thermometer size={18} />,
  'commercial-ac-installation': <Wind size={18} />,
  'commercial-heating-repair': <Wrench size={18} />,
  'commercial-heating-installation': <Settings size={18} />,
  'rooftop-unit-service': <Building2 size={18} />,
  'chiller-repair-maintenance': <Thermometer size={18} />,
  'boiler-service': <Settings size={18} />,
  'ductwork-installation-repair': <Wind size={18} />,
  'emergency-hvac-service': <Zap size={18} />,
  'building-automation-systems': <Settings size={18} />,
  'preventive-maintenance-plans': <CheckCircle size={18} />,
  'energy-audits-retrofits': <CheckCircle size={18} />,
  'indoor-air-quality': <Wind size={18} />,
  'commercial-refrigeration': <Thermometer size={18} />,
  'vrf-vrv-systems': <Settings size={18} />,
}

// Map icon string names from BUILDING_TYPES to Lucide components
const BUILDING_ICON_MAP: Record<string, React.ReactNode> = {
  Building2: <Building2 size={15} />,
  Store: <Store size={15} />,
  Factory: <Factory size={15} />,
  HeartPulse: <HeartPulse size={15} />,
  GraduationCap: <GraduationCap size={15} />,
  Bed: <Bed size={15} />,
  Server: <Server size={15} />,
  Building: <Building2 size={15} />,
  Landmark: <Landmark size={15} />,
  Utensils: <Utensils size={15} />,
  Layers: <Layers size={15} />,
}

function ProjectTypeLabel({ type }: { type: SampleProject['project_type'] }) {
  const labels: Record<string, { label: string; color: string }> = {
    new_installation: { label: 'New Installation', color: 'bg-blue-100 text-blue-800' },
    replacement: { label: 'Replacement', color: 'bg-orange-100 text-orange-800' },
    retrofit: { label: 'Retrofit', color: 'bg-purple-100 text-purple-800' },
    repair: { label: 'Repair', color: 'bg-red-100 text-red-800' },
    maintenance_contract: { label: 'Maintenance Contract', color: 'bg-green-100 text-green-800' },
  }
  if (!type) return null
  const meta = labels[type] || { label: type, color: 'bg-neutral-100 text-neutral-700' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', meta.color)}>
      {meta.label}
    </span>
  )
}

function ProjectCard({ project }: { project: SampleProject }) {
  const buildingTypeMeta = BUILDING_TYPES.find((b) => b.value === project.building_type)
  const systemTypeMeta = SYSTEM_TYPES.find((s) => s.value === project.system_type)

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header band */}
      <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-100">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <h4 className="text-sm font-semibold text-neutral-900 flex-1 leading-snug">
            {project.project_name}
          </h4>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <ProjectTypeLabel type={project.project_type} />
          {buildingTypeMeta && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
              {BUILDING_ICON_MAP[buildingTypeMeta.icon] ?? <Building2 size={12} />}
              {buildingTypeMeta.label}
            </span>
          )}
          {systemTypeMeta && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
              {systemTypeMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {project.description && (
          <p className="text-sm text-neutral-700 leading-relaxed mb-4">{project.description}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {project.square_footage && (
            <div className="text-center bg-neutral-50 rounded-lg px-3 py-2">
              <p className="text-xs text-neutral-400 mb-0.5">Sq Footage</p>
              <p className="text-sm font-semibold text-neutral-800">
                {project.square_footage.toLocaleString()} sf
              </p>
            </div>
          )}
          {project.tonnage && (
            <div className="text-center bg-neutral-50 rounded-lg px-3 py-2">
              <p className="text-xs text-neutral-400 mb-0.5">Tonnage</p>
              <p className="text-sm font-semibold text-neutral-800">{project.tonnage}T</p>
            </div>
          )}
          {project.project_value_range && (
            <div className="text-center bg-neutral-50 rounded-lg px-3 py-2">
              <p className="text-xs text-neutral-400 mb-0.5">Value Range</p>
              <p className="text-sm font-semibold text-neutral-800">{project.project_value_range}</p>
            </div>
          )}
          {project.energy_savings_pct && (
            <div className="text-center bg-green-50 rounded-lg px-3 py-2">
              <p className="text-xs text-green-600 mb-0.5">Energy Savings</p>
              <p className="text-sm font-semibold text-green-700">{project.energy_savings_pct}%</p>
            </div>
          )}
        </div>

        {/* Location + date */}
        {(project.city || project.completion_date) && (
          <div className="flex flex-wrap gap-x-4 mt-3 text-xs text-neutral-400">
            {project.city && project.state && (
              <span>{project.city}, {project.state}</span>
            )}
            {project.completion_date && (
              <span>
                Completed{' '}
                {new Date(project.completion_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RatingBarChart({ reviews }: { reviews: Review[] }) {
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }))
  const max = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="space-y-1.5">
      {distribution.map(({ stars, count }) => (
        <div key={stars} className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 w-3 shrink-0">{stars}</span>
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning rounded-full transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-neutral-400 w-4 shrink-0 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const dateStr = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const buildingTypeMeta = review.building_type
    ? BUILDING_TYPES.find((b) => b.value === review.building_type)
    : null

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-neutral-900">{review.reviewer_name}</span>
            {review.is_verified && (
              <Badge variant="verified" className="text-[10px]">
                <CheckCircle size={9} aria-hidden="true" />
                Verified
              </Badge>
            )}
          </div>
          {/* Reviewer title + company */}
          <div className="flex flex-wrap items-center gap-1.5">
            {review.reviewer_title && (
              <span className="text-xs font-medium text-primary-700">{review.reviewer_title}</span>
            )}
            {review.reviewer_company && review.reviewer_title && (
              <span className="text-xs text-neutral-300">·</span>
            )}
            {review.reviewer_company && (
              <p className="text-xs text-neutral-500">{review.reviewer_company}</p>
            )}
          </div>
          {/* Building type context */}
          {buildingTypeMeta && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-neutral-400">
                {BUILDING_ICON_MAP[buildingTypeMeta.icon] ?? <Building2 size={11} />}
              </span>
              <span className="text-xs text-neutral-400">{buildingTypeMeta.label}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RatingStars rating={review.rating} size="sm" />
          <span className="text-xs text-neutral-400">{dateStr}</span>
        </div>
      </div>

      {review.title && (
        <h4 className="text-sm font-semibold text-neutral-800 mb-1.5">{review.title}</h4>
      )}
      <p className="text-sm text-neutral-700 leading-relaxed">{review.body}</p>

      {review.response && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-primary-200 bg-primary-50 rounded-r-lg py-3 pr-4">
          <p className="text-xs font-semibold text-primary-700 mb-1">Response from contractor</p>
          <p className="text-sm text-neutral-700 leading-relaxed">{review.response}</p>
          {review.response_date && (
            <p className="text-[11px] text-neutral-400 mt-1">
              {new Date(review.response_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContractorProfileTabs({ contractor }: Props) {
  const hasProjects = !!(contractor.sample_projects && contractor.sample_projects.length > 0)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const reviews = contractor.reviews || []
  const todayKey = getTodayKey()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: `Services (${contractor.services?.length || 0})` },
    { id: 'reviews', label: `Reviews (${contractor.review_count})` },
    ...(hasProjects ? [{ id: 'projects' as Tab, label: `Projects (${contractor.sample_projects!.length})` }] : []),
    { id: 'photos', label: 'Photos' },
  ]

  return (
    <div>
      {/* Tab nav */}
      <div className="flex border-b border-neutral-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            )}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          {/* Commercial Capabilities */}
          {(Boolean(contractor.emergency_response_minutes) || contractor.offers_24_7 || Boolean(contractor.sla_summary) || contractor.multi_site_coverage || Boolean(contractor.dispatch_crm)) && (
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <Cpu size={16} className="text-neutral-400" aria-hidden="true" />
                Commercial Capabilities
              </h2>
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {contractor.emergency_response_minutes && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-red-500" aria-hidden="true" />
                        Emergency Response
                      </span>
                      <span className="text-sm font-semibold text-red-700">
                        {contractor.emergency_response_minutes} min guaranteed
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                      <Zap size={14} className="text-neutral-400" aria-hidden="true" />
                      24/7 Availability
                    </span>
                    <span className={cn('text-sm font-semibold', contractor.offers_24_7 ? 'text-green-700' : 'text-neutral-400')}>
                      {contractor.offers_24_7 ? 'Yes — always available' : 'No'}
                    </span>
                  </div>
                  {contractor.multi_site_coverage && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <Building2 size={14} className="text-neutral-400" aria-hidden="true" />
                        Multi-Site Coverage
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {contractor.max_sites_supported
                          ? `Up to ${contractor.max_sites_supported} locations`
                          : 'Available'}
                      </span>
                    </div>
                  )}
                  {contractor.dispatch_crm && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-neutral-400" aria-hidden="true" />
                        Dispatch Platform
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">{contractor.dispatch_crm}</span>
                    </div>
                  )}
                  {contractor.avg_quote_turnaround_hours && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <Timer size={14} className="text-neutral-400" aria-hidden="true" />
                        Avg Quote Turnaround
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {contractor.avg_quote_turnaround_hours} hours
                      </span>
                    </div>
                  )}
                  {contractor.num_technicians && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                        <Users size={14} className="text-neutral-400" aria-hidden="true" />
                        Field Technicians
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {contractor.num_technicians}{contractor.num_nate_certified ? ` (${contractor.num_nate_certified} NATE certified)` : ''}
                      </span>
                    </div>
                  )}
                </div>
                {contractor.sla_summary && (
                  <div className="bg-primary-50 border-t border-primary-100 px-4 py-3">
                    <p className="text-xs font-semibold text-primary-700 mb-1">SLA Summary</p>
                    <p className="text-sm text-primary-800 leading-relaxed">{contractor.sla_summary}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Description */}
          {(Boolean(contractor.description) || Boolean(contractor.google_editorial_summary)) && (
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-3">About</h2>
              <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-line">
                {contractor.description || contractor.google_editorial_summary || ''}
              </div>
              {!contractor.description && Boolean(contractor.google_editorial_summary) && (
                <p className="text-xs text-neutral-400 mt-2">Source: Google Business Profile</p>
              )}
            </section>
          )}

          {/* Equipment & Systems */}
          {(contractor.system_types.length > 0 || contractor.brands_serviced.length > 0 || contractor.tonnage_range_min || contractor.tonnage_range_max) && (
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <Wrench size={16} className="text-neutral-400" aria-hidden="true" />
                Equipment &amp; Systems
              </h2>
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {contractor.system_types.length > 0 && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">System Types Serviced</p>
                    <div className="flex flex-wrap gap-1.5">
                      {contractor.system_types.map((st) => {
                        const found = SYSTEM_TYPES.find((s) => s.value === st)
                        return (
                          <span
                            key={st}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100"
                          >
                            {found ? found.label : st}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                {contractor.brands_serviced.length > 0 && (
                  <div className="px-4 py-4">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Brands Serviced</p>
                    <div className="flex flex-wrap gap-1.5">
                      {contractor.brands_serviced.map((brand) => (
                        <span
                          key={brand}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(contractor.tonnage_range_min != null || contractor.tonnage_range_max != null) && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-600 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-neutral-400" aria-hidden="true" />
                      Tonnage Range
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {contractor.tonnage_range_min ?? '?'}T – {contractor.tonnage_range_max ?? '?'}T
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Building Types Served */}
          {contractor.building_types_served.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <Building2 size={16} className="text-neutral-400" aria-hidden="true" />
                Building Types Served
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contractor.building_types_served.map((btype) => {
                  const meta = BUILDING_TYPES.find((b) => b.value === btype)
                  if (!meta) return null
                  return (
                    <div
                      key={btype}
                      className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-primary-500">
                        {BUILDING_ICON_MAP[meta.icon] ?? <Building2 size={15} />}
                      </span>
                      <span className="text-sm text-neutral-800 font-medium">{meta.label}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Sample Projects (preview) */}
          {hasProjects && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-neutral-900">Recent Projects</h2>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-4">
                {contractor.sample_projects!.slice(0, 2).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

          {/* Operating Hours */}
          {(() => {
            const normalizedHours = normalizeHoursKeys(contractor.operating_hours)
            const hasStructuredHours = normalizedHours && Object.keys(normalizedHours).length > 0
            const weekdayText = contractor.google_hours?.weekday_text
            const hasWeekdayText = weekdayText && weekdayText.length > 0

            if (!hasStructuredHours && !hasWeekdayText) return null

            return (
              <section>
                <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-neutral-400" aria-hidden="true" />
                  Operating Hours
                </h2>
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {hasStructuredHours ? (
                        DAYS_ORDER.map((day) => {
                          const hours = normalizedHours[day]
                          const isToday = day === todayKey
                          return (
                            <tr
                              key={day}
                              className={cn(
                                'border-b last:border-b-0 border-neutral-100',
                                isToday && 'bg-primary-50'
                              )}
                            >
                              <td className={cn('px-4 py-2.5 font-medium', isToday ? 'text-primary-700' : 'text-neutral-700')}>
                                {day}
                                {isToday && (
                                  <span className="ml-2 text-xs font-semibold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full">
                                    Today
                                  </span>
                                )}
                              </td>
                              <td className={cn('px-4 py-2.5 text-right', isToday ? 'text-primary-700 font-medium' : 'text-neutral-500')}>
                                {hours ? `${formatHour(hours.open)} – ${formatHour(hours.close)}` : 'Closed'}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        weekdayText!.map((line) => {
                          const colonIdx = line.indexOf(':')
                          const dayName = colonIdx > -1 ? line.slice(0, colonIdx).trim() : line
                          const timeStr = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : ''
                          const isToday = dayName === todayKey
                          return (
                            <tr
                              key={line}
                              className={cn(
                                'border-b last:border-b-0 border-neutral-100',
                                isToday && 'bg-primary-50'
                              )}
                            >
                              <td className={cn('px-4 py-2.5 font-medium', isToday ? 'text-primary-700' : 'text-neutral-700')}>
                                {dayName}
                                {isToday && (
                                  <span className="ml-2 text-xs font-semibold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full">
                                    Today
                                  </span>
                                )}
                              </td>
                              <td className={cn('px-4 py-2.5 text-right', isToday ? 'text-primary-700 font-medium' : 'text-neutral-500')}>
                                {timeStr || 'Closed'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {!hasStructuredHours && hasWeekdayText && (
                  <p className="text-xs text-neutral-400 mt-2">Hours from Google Business Profile</p>
                )}
              </section>
            )
          })()}

          {/* Service Areas */}
          {contractor.service_areas && contractor.service_areas.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-neutral-400" aria-hidden="true" />
                Service Areas
              </h2>
              <div className="flex flex-wrap gap-2">
                {contractor.service_areas.map((area) => (
                  <Badge key={area.id} variant="service">
                    {area.city}, {area.state_abbr}
                  </Badge>
                ))}
                {contractor.service_radius_miles > 0 && (
                  <Badge variant="default">
                    Up to {contractor.service_radius_miles} miles
                  </Badge>
                )}
              </div>
            </section>
          )}

          {/* License & Insurance */}
          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-neutral-400" aria-hidden="true" />
              License &amp; Insurance
            </h2>
            <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {contractor.license_number && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-neutral-600">License Number</span>
                  <span className="text-sm font-mono font-medium text-neutral-900">{contractor.license_number}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-neutral-600">Insurance Verified</span>
                <span className={cn('text-sm font-medium', contractor.insurance_verified ? 'text-green-600' : 'text-neutral-400')}>
                  {contractor.insurance_verified ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} aria-hidden="true" /> Verified
                    </span>
                  ) : 'Not verified'}
                </span>
              </div>
              {contractor.year_established && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-neutral-600">In Business Since</span>
                  <span className="text-sm font-medium text-neutral-900">{contractor.year_established}</span>
                </div>
              )}
            </div>
          </section>

          {/* Location Map */}
          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-neutral-400" aria-hidden="true" />
              Location
            </h2>
            {(() => {
              const addressStr = contractor.google_formatted_address || `${contractor.street_address || ''} ${contractor.city}, ${contractor.state} ${contractor.zip_code || ''}`.trim()
              const hasCoords = contractor.google_lat && contractor.google_lng
              return (
                <div className="rounded-xl overflow-hidden border border-neutral-200">
                  {hasCoords ? (
                    <MapEmbed
                      lat={Number(contractor.google_lat)}
                      lng={Number(contractor.google_lng)}
                      label={contractor.company_name}
                    />
                  ) : (
                    <div className="h-[260px] bg-neutral-100 flex items-center justify-center text-sm text-neutral-500">
                      Map unavailable
                    </div>
                  )}
                  <div className="bg-white px-4 py-3">
                    <p className="text-sm font-medium text-neutral-700">{addressStr}</p>
                  </div>
                </div>
              )
            })()}
          </section>
        </div>
      )}

      {/* ── Services Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'services' && (
        <div>
          <h2 className="text-base font-semibold text-neutral-900 mb-4">Services Offered</h2>
          {contractor.services && contractor.services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contractor.services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    'flex items-start gap-3 bg-white border rounded-xl p-4',
                    service.category === 'Emergency'
                      ? 'border-red-200 bg-red-50'
                      : 'border-neutral-200'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    service.category === 'Emergency'
                      ? 'bg-red-100 text-red-600'
                      : service.category === 'Installation'
                        ? 'bg-primary-100 text-primary-600'
                        : service.category === 'Repair'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-accent-100 text-accent-600'
                  )}>
                    {SERVICE_ICONS[service.slug] || <Settings size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{service.description}</p>
                    )}
                    <Badge
                      variant={
                        service.category === 'Emergency' ? 'emergency'
                          : service.category === 'Installation' ? 'service'
                            : 'default'
                      }
                      className="mt-1.5 text-[10px]"
                    >
                      {service.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No services listed.</p>
          )}

          {/* Service agreements callout */}
          {contractor.offers_service_agreements && contractor.service_agreement_types.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <ClipboardList size={15} className="text-neutral-400" aria-hidden="true" />
                Service Agreement Types Available
              </h3>
              <div className="flex flex-wrap gap-2">
                {contractor.service_agreement_types.map((sat) => {
                  const found = SERVICE_AGREEMENT_TYPES.find((s) => s.value === sat)
                  return (
                    <span
                      key={sat}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-50 text-accent-700 border border-accent-200"
                    >
                      <CheckCircle size={13} className="mr-1.5" aria-hidden="true" />
                      {found ? found.label : sat}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reviews Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div>
          {/* Rating Summary */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-neutral-900 font-display">
                  {contractor.avg_rating.toFixed(1)}
                </div>
                <RatingStars rating={contractor.avg_rating} size="md" className="mt-2 justify-center" />
                <p className="text-xs text-neutral-400 mt-1">
                  Based on {contractor.review_count} reviews
                </p>
              </div>
              <div className="flex-1">
                <RatingBarChart reviews={reviews} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">
              {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
            </h2>
            <Button variant="outline" size="sm">
              Write a Review
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
              <p className="text-neutral-500 text-sm">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      )}

      {/* ── Projects Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'projects' && hasProjects && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Project Portfolio
            </h2>
            <span className="text-xs text-neutral-400">
              {contractor.sample_projects!.length} project{contractor.sample_projects!.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-4">
            {contractor.sample_projects!
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
          </div>
        </div>
      )}

      {/* ── Photos Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">Photos</h2>
          </div>

          {/* Contractor-uploaded photos */}
          {contractor.photos && contractor.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contractor.photos.map((photo) => (
                <div key={photo.id} className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Project photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Show Google photos if no uploaded photos */
            contractor.google_photos && contractor.google_photos.length > 0 ? (
              <>
                <p className="text-xs text-neutral-400 mb-3">Photos from Google Business Profile</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {contractor.google_photos.map((gPhoto, i) => (
                    <div key={i} className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
                      <img
                        src={`/api/admin/google-sync?photo_reference=${gPhoto.photo_reference}&maxwidth=400`}
                        alt={`Google Business photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-neutral-200 rounded-xl flex flex-col items-center justify-center border border-neutral-300 text-neutral-400"
                  >
                    <Camera size={24} aria-hidden="true" />
                    <span className="text-xs mt-1.5">No photo</span>
                  </div>
                ))}
              </div>
            )
          )}
          <p className="text-sm text-neutral-400 text-center mt-6">
            {contractor.photos && contractor.photos.length > 0
              ? 'Photos uploaded by the contractor.'
              : 'Photos will appear once uploaded by the contractor or synced from Google.'}
          </p>
        </div>
      )}
    </div>
  )
}
