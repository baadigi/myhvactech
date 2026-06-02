'use client'

import { useState } from 'react'

export interface Candidate {
  id: string
  name: string
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  contact_name: string | null
  website: string | null
  source: string | null
  needs_website: boolean
  status: string
}

export default function CandidatesClient({ initial }: { initial: Candidate[] }) {
  const [rows, setRows] = useState<Candidate[]>(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onlyNeedsSite, setOnlyNeedsSite] = useState(false)

  const visible = onlyNeedsSite ? rows.filter((r) => r.needs_website) : rows

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`${action} failed: ${data.error || res.status}`)
        return
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(`${action} failed: ${e instanceof Error ? e.message : 'network error'}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={onlyNeedsSite}
            onChange={(e) => setOnlyNeedsSite(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Only website-sales leads ({rows.filter((r) => r.needs_website).length})
        </label>
        <span className="text-sm text-neutral-500">{visible.length} shown</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-3">Company</th>
              <th className="text-left font-medium px-4 py-3">City</th>
              <th className="text-left font-medium px-4 py-3">Contact</th>
              <th className="text-left font-medium px-4 py-3">Website</th>
              <th className="text-left font-medium px-4 py-3">Source</th>
              <th className="text-right font-medium px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{r.name}</div>
                  {r.phone && <div className="text-xs text-neutral-400">{r.phone}</div>}
                </td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {r.city || <span className="text-red-500">no city</span>}
                  {r.state ? `, ${r.state}` : ''}
                </td>
                <td className="px-4 py-3">
                  {r.contact_name && <div className="text-neutral-700">{r.contact_name}</div>}
                  {r.email ? (
                    <a href={`mailto:${r.email}`} className="text-xs text-primary-600 hover:underline">
                      {r.email}
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">no email</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.needs_website ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Needs site
                    </span>
                  ) : (
                    <a
                      href={r.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline break-all"
                    >
                      {(r.website || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">{r.source}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => act(r.id, 'approve')}
                      disabled={busy === r.id || !r.city}
                      title={!r.city ? 'No city — cannot publish' : 'Publish to directory'}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busy === r.id ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => act(r.id, 'reject')}
                      disabled={busy === r.id}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  Nothing to review. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
