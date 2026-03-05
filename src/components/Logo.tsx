import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
}

export default function Logo({ className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-label="My HVAC Tech">
      <Image
        src="/logo.jpg"
        alt="My HVAC Tech"
        width={160}
        height={73}
        className="h-10 w-auto"
        priority
      />
    </span>
  )
}
