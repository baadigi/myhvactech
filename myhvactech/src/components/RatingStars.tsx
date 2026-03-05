import { cn } from '@/lib/utils'
import { getStarArray } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  count?: number
  className?: string
}

const sizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
}

function StarIcon({
  fill,
  size,
}: {
  fill: 'full' | 'half' | 'empty'
  size: number
}) {
  const id = `half-${Math.random().toString(36).slice(2, 8)}`

  if (fill === 'full') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 1.5L12.39 6.7L18.18 7.57L14.09 11.56L15.08 17.32L10 14.77L4.92 17.32L5.91 11.56L1.82 7.57L7.61 6.7L10 1.5Z"
          fill="#f59e0b"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (fill === 'half') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="100%" y1="0" y2="0">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>
        <path
          d="M10 1.5L12.39 6.7L18.18 7.57L14.09 11.56L15.08 17.32L10 14.77L4.92 17.32L5.91 11.56L1.82 7.57L7.61 6.7L10 1.5Z"
          fill={`url(#${id})`}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 1.5L12.39 6.7L18.18 7.57L14.09 11.56L15.08 17.32L10 14.77L4.92 17.32L5.91 11.56L1.82 7.57L7.61 6.7L10 1.5Z"
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function RatingStars({
  rating,
  size = 'md',
  showCount = false,
  count,
  className,
}: RatingStarsProps) {
  const stars = getStarArray(rating)
  const px = sizeMap[size]
  const label = `Rated ${rating.toFixed(1)} out of 5 stars`

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={label}
      role="img"
    >
      <span className="inline-flex items-center gap-0.5">
        {stars.map((fill, i) => (
          <StarIcon key={i} fill={fill} size={px} />
        ))}
      </span>
      {showCount && count !== undefined && (
        <span
          className={cn(
            'text-neutral-500 leading-none',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
          aria-hidden="true"
        >
          ({count.toLocaleString()})
        </span>
      )}
    </span>
  )
}
