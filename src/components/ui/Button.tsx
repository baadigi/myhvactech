'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  asChild?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 shadow-sm',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
  outline:
    'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
  destructive:
    'bg-error text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      asChild: _asChild,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, ButtonVariant, ButtonSize }
