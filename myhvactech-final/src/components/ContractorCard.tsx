'use client'

import Link from 'next/link'
import { Phone, MessageSquare, CheckCircle, Star, MapPin, Zap, AlertTriangle, Building2, ClipboardList } from 'lucide-react'
import { type Contractor, type Service } from '@/lib/types'
import { SYSTEM_TYPES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import RatingStars from '@/components/RatingStars'
import { cn, formatPhoneNumber, truncate } from '@/lib/utils'

interface ContractorCardProps {
  contractor: Contractor
  services?: Service[]
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function ContractorCard({
  contractor,
  services = [],
  className,
}: ContractorCardProps) {
  const initials = getInitials(contractor.company_name)
  const allServices = contractor.services ?? services
  const visibleServices = allServices.slice(0, 3)
  const extraCount = allServices.length - visibleServices.length

  const isEmergency = allServices.some(
    (s) => s.slug === 'emergency-hvac-service'
  )

  // Commercial indicators
  const hasResponseTime = contractor.emergency_response_minutes != null
  const has24_7 = contractor.offers_24_7
  const hasMultiSite = contractor.multi_site_coverage
  const hasServiceAgreements = contractor.offers_service_agreements

  // Resolve first 3 system type labels for display
  const visibleSystemTypes = (contractor.system_types ?? []).slice(0, 3).map((st) => {
    const found = SYSTEM_TYPES.find((s) => s.value === st)
    if (!found) return st.toUpperCase()
    // Shorten common labels for compact card display
    const shortenMap: Record<string, string> = {
      rtu: 'RTU',
      vrf: 'VRF',
      chilled_water: 'Chilled Water',
      split_system: 'Split System',
      boiler: 'Boiler',
      heat_pump: 'Heat Pump',
      ahu: 'AHU',
      cooling_tower: 'Cooling Tower',
      ptac: 'PTAC',
      geothermal: 'Geothermal',
    }
    return shortenMap[st] ?? found.label
  })
  const extraSystemCount = (contractor.system_types ?? []).length - visibleSystemTypes.length

  return (
    <Link
      href={`/contractors/${contractor.slug}`}
      className={cn(
        'group block bg-white rounded-lg border border-neutral-200 shadow-sm',
        'hover:shadow-md hover:border-neutral-300 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
      aria-label={`View ${contractor.company_name} profile`}
    >
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Logo / Initials */}
        <div className="sm:w-28 shrink-0 flex items-start justify-center sm:justify-start p-4 pb-0 sm:pb-4 sm:pr-0">
          {contractor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contractor.logo_url}
              alt={`${contractor.company_name} logo`}
              className="w-16 h-16 rounded-lg object-contain border border-neutral-100 bg-neutral-50"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #134a8a 0%, #0e3060 100%)' }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-snug">
              {contractor.company_name}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {contractor.is_verified && (
                <Badge variant="verified" className="shrink-0">
                  <CheckCircle size={11} aria-hidden="true" />
                  Verified
                </Badge>
              )}
              {contractor.is_featured && (
                <Badge variant="featured" className="shrink-0">
                  <Star size={11} aria-hidden="true" />
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Location */}
          <p className="flex items-center gap-1 text-sm text-neutral-500 mb-1.5">
            <MapPin size={13} aria-hidden="true" />
            {contractor.city}, {contractor.state}
            {contractor.distance_miles !== undefined && (
              <span className="ml-1 text-neutral-400">
                · {Math.round(contractor.distance_miles)} mi away
              </span>
            )}
          </p>

          {/* Commercial indicators: response time + system types */}
          {(hasResponseTime || has24_7 || visibleSystemTypes.length > 0) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
              {(hasResponseTime || has24_7) && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertTriangle size={11} aria-hidden="true" />
                  {hasResponseTime
                    ? `${contractor.emergency_response_minutes}-min Response${has24_7 ? ' · 24/7' : ''}`
                    : '24/7 Available'}
                </span>
              )}
              {visibleSystemTypes.length > 0 && (hasResponseTime || has24_7) && (
                <span className="text-neutral-300 text-xs">·</span>
              )}
              {visibleSystemTypes.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Building2 size={11} aria-hidden="true" />
                  {visibleSystemTypes.join(' · ')}
                  {extraSystemCount > 0 && (
                    <span className="text-neutral-400">+{extraSystemCount}</span>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Commercial badges: service agreements + multi-site */}
          {(hasServiceAgreements || hasMultiSite || isEmergency) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {isEmergency && !hasResponseTime && (
                <Badge variant="emergency" className="shrink-0">
                  <Zap size={11} aria-hidden="true" />
                  24/7
                </Badge>
              )}
              {hasServiceAgreements && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-accent-50 text-accent-700 border border-accent-200 shrink-0">
                  <ClipboardList size={9} aria-hidden="true" />
                  Service Agreements
                </span>
              )}
              {hasMultiSite && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <Building2 size={9} aria-hidden="true" />
                  Multi-Site
                </span>
              )}
            </div>
          )}

          {/* Rating */}
          {contractor.review_count > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <RatingStars
                rating={contractor.avg_rating}
                size="sm"
                showCount
                count={contractor.review_count}
              />
            </div>
          )}

          {/* Short description */}
          {contractor.short_description && (
            <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
              {truncate(contractor.short_description, 120)}
            </p>
          )}

          {/* Service tags */}
          {visibleServices.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {visibleServices.map((svc) => (
                <Badge key={svc.id ?? svc.slug} variant="service">
                  {svc.name}
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="default">+{extraCount} more</Badge>
              )}
            </div>
          )}

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-2 mt-2"
            onClick={(e) => e.preventDefault()}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/contractors/${contractor.slug}/contact`
              }}
            >
              <MessageSquare size={14} aria-hidden="true" />
              Get Quote
            </Button>

            {contractor.phone && (
              <a
                href={`tel:${contractor.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-sm text-neutral-700 font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call ${contractor.company_name}`}
              >
                <Phone size={14} aria-hidden="true" />
                {formatPhoneNumber(contractor.phone)}
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
