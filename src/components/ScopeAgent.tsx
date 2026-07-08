'use client'

// Scope Agent — floating AI job-intake chat. Talks to /api/ai/chat (SSE),
// renders the ranked shortlist behind an email gate, and submits the lead
// through the existing /api/quote-requests pipeline (source: scope_agent).
// Styling matches the site design system (neutral-900 accents, primary links).

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageSquareText, X, Send, Star, Clock, Lock, CheckCircle2 } from 'lucide-react'
import { SITE_NAME } from '@/lib/constants'

const DIRECTORY_PATH = 'contractors'
const DIRECTORY_NOUN_PLURAL = 'contractors'
const TRADE_NOUN = 'HVAC'
import { trackScopeAgent } from '@/lib/analytics'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

interface ShortlistItem {
  id: string
  company_name: string
  slug: string
  city: string | null
  state: string | null
  avg_rating: number | null
  review_count: number | null
  offers_24_7: boolean | null
  reasons: string[]
}

interface Intake {
  city: string | null
  state: string | null
  service_type: string | null
  systems: string[]
  building_type: string | null
  timing: string | null
  scope_summary: string | null
}

const GREETING = `Hi! I can help you find the right commercial ${DIRECTORY_NOUN_PLURAL} for your job. Tell me what's going on — what work do you need, and where?`

interface Geo {
  city: string | null
  region: string | null
  weather: { tempF: number; condition: string | null } | null
}

// Sierra-style opener — only ever built from real /api/geo data.
function personalGreeting(geo: Geo): string {
  const where = `${geo.city}${geo.region ? `, ${geo.region}` : ''}`
  const wx = geo.weather
    ? ` — looks like it's ${geo.weather.tempF}°${geo.weather.condition ? ` and ${geo.weather.condition}` : ''} out there`
    : ''
  return `Hey! I see you're visiting from ${where}${wx}. I help property and facility managers find the right commercial ${TRADE_NOUN} ${DIRECTORY_NOUN_PLURAL} fast. What can I help you with today?`
}

const AUTO_OPEN_MS = 15_000
const AUTO_KEY = 'scope_agent_auto_shown'

export default function ScopeAgent() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: GREETING }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [shortlist, setShortlist] = useState<ShortlistItem[] | null>(null)
  const [intake, setIntake] = useState<Intake | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [lead, setLead] = useState({ name: '', email: '', phone: '' })
  const [leadBusy, setLeadBusy] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [teaser, setTeaser] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const openRef = useRef(false)
  openRef.current = open

  // Personalize the greeting once geo arrives (only while untouched).
  useEffect(() => {
    let cancelled = false
    fetch('/api/geo')
      .then((r) => r.json())
      .then((geo: Geo) => {
        if (cancelled || !geo?.city) return
        setMessages((prev) =>
          prev.length === 1 && prev[0].content === GREETING
            ? [{ role: 'assistant', content: personalGreeting(geo) }]
            : prev
        )
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Proactive open after 15s — once per session; teaser bubble on mobile
  // (auto-covering the screen on a phone loses more leads than it wins).
  useEffect(() => {
    const t = setTimeout(() => {
      if (openRef.current || sessionStorage.getItem(AUTO_KEY)) return
      sessionStorage.setItem(AUTO_KEY, '1')
      if (window.innerWidth >= 640) {
        setOpen(true)
        trackScopeAgent('auto_open')
      } else {
        setTeaser(true)
        trackScopeAgent('auto_teaser')
      }
    }, AUTO_OPEN_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, shortlist, unlocked])

  function toggleOpen() {
    if (!open) trackScopeAgent('open')
    else abortRef.current?.abort() // closing mid-stream — stop the server turn
    setTeaser(false)
    setOpen(!open)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    trackScopeAgent('message_sent')

    const history = [...messages, { role: 'user' as const, content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Drop the canned greeting — the API expects the convo to start with a user turn.
        body: JSON.stringify({ messages: history.slice(1) }),
        signal: abortRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(`chat failed: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let evt: { type: string; text?: string; shortlist?: ShortlistItem[]; intake?: Intake; message?: string }
          try {
            evt = JSON.parse(line.slice(6))
          } catch {
            continue
          }
          if (evt.type === 'text' && evt.text) {
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = {
                role: 'assistant',
                content: next[next.length - 1].content + evt.text,
              }
              return next
            })
          } else if (evt.type === 'shortlist' && evt.shortlist) {
            setShortlist(evt.shortlist)
            setIntake(evt.intake ?? null)
            trackScopeAgent('shortlist_shown', { matches: evt.shortlist.length })
          } else if (evt.type === 'error') {
            setMessages((prev) => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: evt.message || 'Something went wrong — please try again.' }
              return next
            })
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Sorry — I hit a snag. Please try again in a moment.' }
        return next
      })
    } finally {
      setBusy(false)
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (leadBusy) return
    setLeadError('')
    setLeadBusy(true)
    trackScopeAgent('email_submitted')
    try {
      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'scope_agent',
          requestor_name: lead.name,
          requestor_email: lead.email,
          requestor_phone: lead.phone || null,
          service_type: intake?.service_type || 'other',
          building_type: intake?.building_type || null,
          system_types: intake?.systems || [],
          timing: intake?.timing || null,
          property_city: intake?.city || null,
          property_state: intake?.state || null,
          num_buildings: 1,
          scope_agent: {
            scope_summary: intake?.scope_summary || null,
            transcript: messages.map((m) => ({ role: m.role, content: m.content })),
            shortlist: (shortlist || []).map((c) => ({ id: c.id, company_name: c.company_name })),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.details?.join?.(', ') || 'Submission failed')
      setUnlocked(true)
      trackScopeAgent('lead_created')
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Submission failed — please try again.')
    } finally {
      setLeadBusy(false)
    }
  }

  return (
    <>
      {/* Mobile teaser bubble */}
      {teaser && !open && (
        <div className="fixed bottom-20 right-5 z-50 max-w-[280px] rounded-2xl rounded-br-sm border border-neutral-200 bg-white shadow-xl p-3">
          <button
            onClick={() => setTeaser(false)}
            aria-label="Dismiss"
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-xs leading-none"
          >
            ×
          </button>
          <button onClick={toggleOpen} className="text-left text-sm text-neutral-800">
            {messages[0].content}
          </button>
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={toggleOpen}
        aria-label={open ? 'Close Scope Agent chat' : 'Get matched with contractors — chat now'}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-3 shadow-lg hover:bg-neutral-800 transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquareText className="w-5 h-5" />}
        {!open && <span className="text-sm font-semibold hidden sm:inline">Describe your job</span>}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Scope Agent chat"
          className="fixed bottom-20 right-5 z-50 flex flex-col w-[calc(100vw-2.5rem)] max-w-md h-[70vh] max-h-[600px] rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden"
        >
          <div className="bg-neutral-900 text-white px-4 py-3">
            <p className="text-sm font-bold">{SITE_NAME} Scope Agent</p>
            <p className="text-xs text-neutral-400">Describe the job — get a ranked shortlist in minutes</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) =>
              m.content ? (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'bg-neutral-900 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap'
                        : 'bg-neutral-100 text-neutral-800 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap'
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ) : busy && i === messages.length - 1 ? (
                <div key={i} className="flex justify-start">
                  <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              ) : null
            )}

            {/* Shortlist — gated behind the email form until the lead is in */}
            {shortlist && shortlist.length > 0 && (
              <div className="relative">
                <div className={unlocked ? 'space-y-2' : 'space-y-2 blur-sm select-none pointer-events-none'}>
                  {shortlist.map((c) => (
                    <div key={c.id} className="border border-neutral-200 rounded-xl p-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        {unlocked ? (
                          <Link
                            href={`/${DIRECTORY_PATH}/${c.slug}`}
                            className="text-sm font-semibold text-neutral-900 hover:underline"
                          >
                            {c.company_name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-neutral-900">{c.company_name}</span>
                        )}
                        {c.offers_24_7 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">
                            <Clock className="w-3 h-3" /> 24/7
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {[c.city, c.state].filter(Boolean).join(', ')}
                        {c.avg_rating && c.review_count ? (
                          <span className="inline-flex items-center gap-0.5 ml-2 text-neutral-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {Number(c.avg_rating).toFixed(1)} ({c.review_count})
                          </span>
                        ) : null}
                      </p>
                      {c.reasons.length > 0 && (
                        <p className="text-xs text-neutral-600 mt-1">{c.reasons.join(' · ')}</p>
                      )}
                    </div>
                  ))}
                </div>

                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <form
                      onSubmit={submitLead}
                      className="w-full bg-white border border-neutral-200 rounded-xl shadow-lg p-4 space-y-2"
                    >
                      <p className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Your shortlist is ready
                      </p>
                      <p className="text-xs text-neutral-600">
                        Leave your contact info to see your matches and get quotes for this job.
                      </p>
                      <input
                        required
                        value={lead.name}
                        onChange={(e) => setLead({ ...lead, name: e.target.value })}
                        placeholder="Your name"
                        aria-label="Your name"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <input
                        required
                        type="email"
                        value={lead.email}
                        onChange={(e) => setLead({ ...lead, email: e.target.value })}
                        placeholder="Work email"
                        aria-label="Work email"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <input
                        type="tel"
                        value={lead.phone}
                        onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                        placeholder="Phone (optional)"
                        aria-label="Phone (optional)"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                      <button
                        type="submit"
                        disabled={leadBusy}
                        className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {leadBusy ? 'Sending…' : 'Show my matches'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {unlocked && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Request sent — your matched {DIRECTORY_NOUN_PLURAL} have your job details.
              </p>
            )}
          </div>

          <div className="border-t border-neutral-200 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={shortlist && !unlocked ? 'Enter your info above to continue' : 'Describe your job…'}
                disabled={busy || (!!shortlist && !unlocked)}
                aria-label="Message the Scope Agent"
                className="flex-1 border border-neutral-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-50"
              />
              <button
                onClick={sendMessage}
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="bg-neutral-900 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-neutral-800 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
