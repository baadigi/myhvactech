import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'verified' | 'featured' | 'emergency' | 'service'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-neutral-100 text-neutral-700',
  verified:
    'bg-accent-50 text-accent-700',
  featured:
    'bg-yellow-50 text-yellow-700',
  emergency:
    'bg-red-50 text-red-700',
  service:
    'bg-primary-50 text-primary-700',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export type { BadgeProps, BadgeVariant }
