import Link from 'next/link'
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
} from 'lucide-react'
import { type Service } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service | { name: string; slug: string; category: string; description?: string | null; icon?: string | null; id?: string }
  className?: string
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

export default function ServiceCard({ service, className }: ServiceCardProps) {
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
