import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export default function Logo({ className, showText = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label="My HVAC Tech">
      {/* Logomark: stylized air vent grid with airflow lines */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Vent grid body */}
        <rect x="2" y="6" width="28" height="20" rx="3" fill="#2563eb" />
        {/* Vent slats — horizontal bars suggesting airflow */}
        <rect x="5" y="10" width="22" height="2" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="5" y="15" width="22" height="2" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="5" y="20" width="22" height="2" rx="1" fill="white" fillOpacity="0.9" />
        {/* Airflow accent lines emerging from right */}
        <path
          d="M27 9 Q30 11 30 13"
          stroke="#14b8a6"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M27 14 Q31 16 30 19"
          stroke="#14b8a6"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M27 19 Q30 21 29 24"
          stroke="#14b8a6"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showText && (
        <span className="font-display font-700 text-neutral-900 leading-none select-none">
          <span
            className="text-[17px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)' }}
          >
            My{' '}
            <span style={{ color: '#2563eb' }}>HVAC</span>{' '}
            Tech
          </span>
        </span>
      )}
    </span>
  )
}
