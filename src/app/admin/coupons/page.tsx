'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  current_uses: number
  is_active: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxUses, setMaxUses] = useState('')

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      if (!res.ok) throw new Error('Failed to load coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch (err) {
      console.error('Load coupons error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  const resetForm = () => {
    setCode('')
    setDiscountType('percent')
    setDiscountValue('')
    setValidUntil('')
    setMaxUses('')
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) {
      alert('Code and discount value are required.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          valid_until: validUntil || null,
          max_uses: maxUses ? Number(maxUses) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create coupon')
      }

      resetForm()
      loadCoupons()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update coupon')
      loadCoupons()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update coupon')
    }
  }

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete coupon')
      loadCoupons()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete coupon')
    }
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percent') return `${coupon.discount_value}%`
    return `$${(coupon.discount_value / 100).toFixed(2)}`
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-100 rounded w-1/4" />
          <div className="h-12 bg-neutral-100 rounded" />
          <div className="h-12 bg-neutral-100 rounded" />
          <div className="h-12 bg-neutral-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-display">Coupons</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Coupon'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Create New Coupon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                {discountType === 'percent' ? 'Percentage (1-100)' : 'Amount (cents)'}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '20' : '1000'}
                min={1}
                max={discountType === 'percent' ? 100 : undefined}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {discountType === 'fixed' && (
                <p className="text-[10px] text-neutral-400 mt-1">Enter in cents (e.g. 1000 = $10.00)</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Expires (optional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                Max Uses (optional)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} loading={saving} className="w-full">
                Create Coupon
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-neutral-300 mb-3" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
            </svg>
            <p className="text-sm text-neutral-500">No coupons created yet</p>
            <p className="text-xs text-neutral-400 mt-1">Click &quot;+ New Coupon&quot; to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Discount</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Usage</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Expires</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {coupons.map((coupon) => {
                  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date()
                  const isMaxed = coupon.max_uses && coupon.current_uses >= coupon.max_uses
                  return (
                    <tr key={coupon.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono font-semibold text-neutral-900">{coupon.code}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-green-600">{formatDiscount(coupon)} off</span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-neutral-600">
                          {coupon.current_uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`text-sm ${isExpired ? 'text-red-500' : 'text-neutral-500'}`}>
                          {coupon.valid_until
                            ? new Date(coupon.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Never'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {!coupon.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-500">Inactive</span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600">Expired</span>
                        ) : isMaxed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-600">Maxed Out</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-600">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(coupon)}
                            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
                          >
                            {coupon.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
