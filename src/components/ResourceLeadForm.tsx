'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

const labelCls = 'block text-sm font-medium text-neutral-700 mb-1.5'
const fieldCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300'

interface Props {
  source: string
  ctaLabel: string
  note?: string
  // Called after the lead is pushed to GHL — e.g. trigger a download.
  onSuccess?: () => void
}

export default function ResourceLeadForm({ source, ctaLabel, note, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setMsg('')
    try {
      const res = await fetch('/api/resource-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null, city: city || null, state: state || null, source, note }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong')
      }
      setStatus('done')
      onSuccess?.()
    } catch (err) {
      setStatus('error')
      setMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-accent-700 bg-accent-50 border border-accent-200 rounded-lg px-4 py-3">
        Done — check your email. We&apos;ll also have a commercial HVAC specialist reach out if you want help.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className={labelCls} htmlFor="rl-name">Name</label>
        <input id="rl-name" required className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className={labelCls} htmlFor="rl-email">Work email</label>
        <input id="rl-email" type="email" required className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={labelCls} htmlFor="rl-phone">Phone (optional)</label>
        <input id="rl-phone" type="tel" className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className={labelCls} htmlFor="rl-city">City (optional)</label>
          <input id="rl-city" className={fieldCls} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="rl-state">State</label>
          <input id="rl-state" maxLength={2} placeholder="CA" className={fieldCls + ' uppercase'} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
        </div>
      </div>

      {status === 'error' && <p className="sm:col-span-2 text-sm text-red-600">{msg}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-5 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {status === 'sending'
            ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</>
            : <>{ctaLabel} <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </div>
    </form>
  )
}
