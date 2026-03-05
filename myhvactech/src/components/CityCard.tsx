import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateSlug } from '@/lib/utils'

interface CityCardProps {
  city: string
  state: string
  stateAbbr: string
  contractorCount?: number
  className?: string
}

export default function CityCard({
  city,
  state,
  stateAbbr,
  contractorCount,
  className,
}: CityCardProps) {
  const stateSlug = generateSlug(state)
  const citySlug = generateSlug(city)
  const href = `/${stateSlug}/${citySlug}`

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col justify-between p-5 rounded-lg overflow-hidden',
        'bg-white border border-neutral-200 shadow-sm',
        'hover:border-primary-200 hover:shadow-md transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className
      )}
    >
      {/* Subtle gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-lg bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        aria-hidden="true"
      />

      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight">
              {city}
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">{state}</p>
          </div>
          <span
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors"
            aria-hidden="true"
          >
            <MapPin size={16} />
          </span>
        </div>

        {contractorCount !== undefined && (
          <p className="mt-3 text-sm text-neutral-500">
            <span className="font-semibold text-neutral-700">
              {contractorCount.toLocaleString()}
            </span>{' '}
            contractor{contractorCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-primary-600 group-hover:underline underline-offset-2">
        Browse contractors →
      </p>
    </Link>
  )
}
