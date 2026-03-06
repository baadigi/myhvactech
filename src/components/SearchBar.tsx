'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HVAC_SERVICES } from '@/lib/constants'

interface SearchBarProps {
  variant?: 'hero' | 'compact'
  className?: string
  defaultQuery?: string
  defaultCity?: string
}

export default function SearchBar({
  variant = 'hero',
  className,
  defaultQuery = '',
  defaultCity = '',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [location, setLocation] = useState(defaultCity)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const queryInputRef = useRef<HTMLInputElement>(null)

  const filteredServices = query
    ? HVAC_SERVICES.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : HVAC_SERVICES.slice(0, 8)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (location.trim()) params.set('city', location.trim())
    router.push(`/search?${params.toString()}`)
    setShowSuggestions(false)
  }

  const selectService = (serviceName: string) => {
    setQuery(serviceName)
    setShowSuggestions(false)
    queryInputRef.current?.blur()
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isHero = variant === 'hero'

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full',
        isHero
          ? 'bg-white rounded-xl shadow-xl p-2'
          : 'bg-white rounded-lg border border-neutral-200 p-1',
        className
      )}
      role="search"
      aria-label="Search for HVAC contractors"
    >
      <div className={cn('flex flex-col sm:flex-row gap-2')}>
        {/* Service / keyword input */}
        <div className="relative flex-1" ref={suggestionsRef}>
          <label
            htmlFor="search-query"
            className="sr-only"
          >
            What do you need?
          </label>
          <div className="relative">
            <Search
              size={isHero ? 18 : 16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={queryInputRef}
              id="search-query"
              type="text"
              placeholder="What do you need? (e.g. AC repair)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className={cn(
                'w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white',
                'transition-colors',
                isHero ? 'pl-10 pr-4 py-3 text-base' : 'pl-9 pr-3 py-2 text-sm'
              )}
              autoComplete="off"
            />
          </div>

          {/* Dropdown suggestions */}
          {showSuggestions && filteredServices.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
              {filteredServices.map((service) => (
                <button
                  key={service.slug}
                  type="button"
                  onMouseDown={() => selectService(service.name)}
                  className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
                >
                  <Search size={13} className="text-neutral-400 shrink-0" aria-hidden="true" />
                  {service.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider — desktop only */}
        <div
          className="hidden sm:block w-px bg-neutral-200 self-stretch"
          aria-hidden="true"
        />

        {/* Location input */}
        <div className="relative flex-1 sm:max-w-[220px]">
          <label htmlFor="search-location" className="sr-only">
            Where?
          </label>
          <MapPin
            size={isHero ? 18 : 16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="search-location"
            type="text"
            placeholder="City, state, or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={cn(
              'w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white',
              'transition-colors',
              isHero ? 'pl-10 pr-4 py-3 text-base' : 'pl-9 pr-3 py-2 text-sm'
            )}
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          className={cn(
            'shrink-0 bg-primary-500 text-white font-semibold rounded-lg',
            'hover:bg-primary-600 active:bg-primary-700 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'flex items-center justify-center gap-2',
            isHero ? 'w-full sm:w-auto px-7 py-3 text-base' : 'w-full sm:w-auto px-5 py-2 text-sm'
          )}
        >
          <Search size={isHero ? 18 : 15} aria-hidden="true" />
          Search
        </button>
      </div>
    </form>
  )
}
