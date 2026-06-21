'use client'

import { useState } from 'react'
import { User } from 'lucide-react'

// Fixed brand author avatar in the public blog-images bucket. Generated once via
// /api/admin/blog/generate-author-avatar. Falls back to the User icon if the
// image hasn't been generated yet (or fails to load).
const AVATAR_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/author/avatar.webp`
  : null

export default function AuthorAvatar({ className = 'w-5 h-5' }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  if (!AVATAR_URL || failed) {
    return <User className={className} aria-hidden="true" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={AVATAR_URL}
      alt="My HVAC Tech"
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover bg-neutral-100`}
    />
  )
}
