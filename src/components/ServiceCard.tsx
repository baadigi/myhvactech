import Link from 'next/link'
import Image from 'next/image'
import {
  Wrench,
  Flame,
  Wind,
  Zap,
  Snowflake,
  Settings,
  Thermometer,
  Box,
  BarChart2,
  Clock,
  Activity,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { type Service } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service | { name: string; slug: string; category: string; description?: string | null; icon?: string | null; id?: string }
  className?: string
  /** 'compact' = icon + label row (default). 'tile' = Angi-style photo tile. */
  variant?: 'compact' | 'tile'
  /** Explicit image path for tile variant. Falls back to /images/services/{slug}.png */
  image?: string
}

// Map service slugs/names to appropriate icons
function getServiceIcon(slug: string, category: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'commercial-ac-repair': <Snowflake size={24} />,
    'commercial-ac-installation': <Wind size={24} />,
    'commercial-heating-repair': <Flame size={24} />,
    'commercial-heating-installation': <Thermometer size={24} />,
    'rooftop-unit-service': <Building2 size={24} />,
    'chiller-repair-maintenance': <Activity size={24} />,
    'boiler-service': <Box size={24} />,
    'ductwork-installation-repair': <Wind size={24} />,
    'commercial-refrigeration': <Snowflake size={24} />,
    'preventive-maintenance-plans': <Clock size={24} />,
    'emergency-hvac-service': <Zap size={24} />,
    'building-automation-systems': <BarChart2 size={24} />,
    'indoor-air-quality': <Activity size={24} />,
    'energy-audits-retrofits': <BarChart2 size={24} />,
    'vrf-vrv-systems': <Settings size={24} />,
  }

  if (iconMap[slug]) return iconMap[slug]

  // Fallback by category
  if (category === 'Repair') return <Wrench size={24} />
  if (category === 'Emergency') return <Zap size={24} />
  if (category === 'Installation') return <Settings size={24} />
  return <Wrench size={24} />
}

export default function ServiceCard({ service, className, variant = 'compact', image }: ServiceCardProps) {
  // ——— Tile variant: photo-forward card (Angi-style) ———
  // A branded gradient + icon is ALWAYS painted underneath, so a tile is never
  // blank/black — even before its photo exists or while it loads. The photo (when
  // present) covers the base.
  if (variant === 'tile') {
    return (
      <Link
        href={`/services/${service.slug}`}
        className={cn(
          'group relative flex flex-col justify-end overflow-hidden rounded-xl border border-neutral-200 aspect-[4/3]',
          'bg-gradient-to-br from-primary-700 to-primary-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          className
        )}
      >
        {/* Branded fallback layer: large faint icon, centered */}
        <span
          className="absolute inset-0 flex items-center justify-center text-white/15 [&>svg]:w-20 [&>svg]:h-20"
          aria-hidden="true"
        >
          {getServiceIcon(service.slug, service.category)}
        </span>

        {/* Photo (only when a real image exists) */}
        {image && (
          <Image
            src={image}
            alt={`${service.name} — commercial HVAC contractors`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {/* Gradient scrim for label legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/25 to-transparent"
          aria-hidden="true"
        />
        <div className="relative flex items-end justify-between gap-2 p-4">
          <h3 className="text-base font-semibold text-white leading-snug drop-shadow-sm">
            {service.name}
          </h3>
          <ArrowRight
            size={18}
            className="shrink-0 text-white/80 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    )
  }

  // ——— Compact variant: icon + label row (default) ———
  const icon = getServiceIcon(service.slug, service.category)

  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        'group flex items-center gap-3 p-4 bg-white rounded-lg border border-neutral-200',
        'hover:border-primary-200 hover:bg-primary-50 hover:shadow-sm transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors shrink-0"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-700 transition-colors leading-snug">
        {service.name}
      </span>
    </Link>
  )
}
