'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Building2, Calculator, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { BUILDING_TYPES, SYSTEM_TYPES } from '@/lib/constants'
import { estimateCost, formatUSD, type ServiceKind } from '@/lib/hvac-cost'

const SERVICES: { value: string; kind: ServiceKind; label: string }[] = [
  { value: 'replacement', kind: 'replacement', label: 'Replace existing system' },
  { value: 'new_install', kind: 'new_install', label: 'New installation' },
  { value: 'repair', kind: 'repair', label: 'Repair' },
  { value: 'maintenance_agreement', kind: 'maintenance', label: 'Preventive maintenance plan' },
]

// Count a number up to `target` when it changes (no animation library needed).
function useCountUp(target: number, duration = 550): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const startRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const delta = target - from
    if (delta === 0) return
    let raf = 0
    const tick = (t: number) => {
      if (!startRef.current) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + delta * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else { fromRef.current = target; startRef.current = 0 }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

const labelCls = 'block text-sm font-medium text-neutral-700 mb-1.5'
const fieldCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300'

export default function CostEstimator() {
  const [buildingType, setBuildingType] = useState('office')
  const [systemType, setSystemType] = useState('rtu')
  const [service, setService] = useState('replacement')
  const [mode, setMode] = useState<'sqft' | 'tons'>('sqft')
  const [sqft, setSqft] = useState(20000)
  const [tons, setTons] = useState(40)

  const serviceKind = SERVICES.find((s) => s.value === service)?.kind ?? 'replacement'

  const estimate = useMemo(
    () => estimateCost({
      buildingType,
      systemType,
      serviceKind,
      squareFeet: mode === 'sqft' ? sqft : null,
      tons: mode === 'tons' ? tons : null,
    }),
    [buildingType, systemType, serviceKind, mode, sqft, tons]
  )

  const low = useCountUp(estimate?.low ?? 0)
  const high = useCountUp(estimate?.high ?? 0)

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      {/* ── Inputs ─────────────────────────────────────────────── */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7">
        <div className="flex items-center gap-2 mb-5">
          <Calculator size={18} className="text-primary-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutral-900">Estimate your project</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelCls} htmlFor="ce-service">What do you need?</label>
            <select id="ce-service" className={fieldCls} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls} htmlFor="ce-building">Building type</label>
              <select id="ce-building" className={fieldCls} value={buildingType} onChange={(e) => setBuildingType(e.target.value)}>
                {BUILDING_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ce-system">System type</label>
              <select id="ce-system" className={fieldCls} value={systemType} onChange={(e) => setSystemType(e.target.value)}>
                {SYSTEM_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* sqft / tons toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-neutral-700">
                {mode === 'sqft' ? 'Building size' : 'System capacity'}
              </span>
              <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('sqft')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${mode === 'sqft' ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                >Square feet</button>
                <button
                  type="button"
                  onClick={() => setMode('tons')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${mode === 'tons' ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
                >I know my tonnage</button>
              </div>
            </div>

            {mode === 'sqft' ? (
              <>
                <input
                  type="range" min={2000} max={250000} step={1000} value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  className="w-full accent-primary-600"
                  aria-label="Building square footage"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="number" min={500} value={sqft}
                    onChange={(e) => setSqft(Math.max(0, Number(e.target.value)))}
                    className={fieldCls + ' max-w-[160px]'}
                  />
                  <span className="text-sm text-neutral-500">sq ft</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} value={tons}
                  onChange={(e) => setTons(Math.max(0, Number(e.target.value)))}
                  className={fieldCls + ' max-w-[160px]'}
                />
                <span className="text-sm text-neutral-500">tons of cooling</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Result (sticky) ────────────────────────────────────── */}
      <div className="lg:col-span-2 lg:sticky lg:top-6">
        <div className="rounded-2xl bg-primary-600 text-white p-6 sm:p-7 shadow-sm">
          <p className="text-sm text-primary-100 mb-1">Estimated {serviceKind === 'maintenance' ? 'annual cost' : 'project cost'}</p>
          {estimate ? (
            <>
              <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                {formatUSD(low)} <span className="text-primary-200 font-semibold">–</span> {formatUSD(high)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-primary-500/40 rounded-lg px-3 py-2">
                  <div className="text-primary-100 text-xs">Est. capacity</div>
                  <div className="font-semibold">{estimate.tons.toFixed(0)} tons</div>
                </div>
                {estimate.perSqftLow != null && (
                  <div className="bg-primary-500/40 rounded-lg px-3 py-2">
                    <div className="text-primary-100 text-xs">Per sq ft</div>
                    <div className="font-semibold">${estimate.perSqftLow}–${estimate.perSqftHigh}</div>
                  </div>
                )}
              </div>
              <p className="text-xs text-primary-100 mt-4 leading-relaxed">{estimate.basis}</p>
              <p className="text-[11px] text-primary-200 mt-2">
                Ballpark only — real costs depend on equipment, access, and local labor. Get exact numbers below.
              </p>
            </>
          ) : (
            <p className="text-primary-100 text-sm">Enter your building size to see an estimate.</p>
          )}
        </div>
      </div>

      {/* ── Lead capture ───────────────────────────────────────── */}
      <div className="lg:col-span-5">
        <LeadForm
          buildingType={buildingType}
          systemType={systemType}
          service={service}
          sqft={mode === 'sqft' ? sqft : null}
          estimateNote={estimate ? `Cost-calculator estimate: ${formatUSD(estimate.low)}–${formatUSD(estimate.high)} (${estimate.tons.toFixed(0)} tons, ${service}, ${systemType})` : null}
        />
      </div>
    </div>
  )
}

// ─── Lead form: submits to the existing quote-requests pipeline ──────────────

function LeadForm(props: {
  buildingType: string
  systemType: string
  service: string
  sqft: number | null
  estimateNote: string | null
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_type: props.buildingType,
          property_sqft: props.sqft,
          num_buildings: 1,
          num_units_rtus: null,
          system_types: [props.systemType],
          service_type: props.service,
          current_issues: props.estimateNote,
          budget_band: null,
          timing: null,
          requestor_name: name,
          requestor_email: email,
          requestor_phone: phone || null,
          requestor_title: null,
          company_name: null,
          property_city: city || null,
          property_state: state || null,
          property_zip: null,
          source: 'cost-calculator',
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong')
      }
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-accent-200 bg-accent-50 p-6 sm:p-7 flex items-start gap-3">
        <CheckCircle size={22} className="text-accent-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-neutral-900">Request received</h3>
          <p className="text-sm text-neutral-600 mt-1">
            We&apos;re matching you with vetted commercial HVAC contractors{city ? ` near ${city}` : ''}. Expect quotes shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={18} className="text-primary-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-neutral-900">Get exact quotes from commercial HVAC contractors</h3>
      </div>
      <p className="text-sm text-neutral-600 mb-5">
        An estimate is a starting point. Tell us where the building is and get real numbers from vetted contractors — free, no obligation.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="lf-name">Name</label>
          <input id="lf-name" required className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="lf-email">Work email</label>
          <input id="lf-email" type="email" required className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="lf-phone">Phone (optional)</label>
          <input id="lf-phone" type="tel" className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className={labelCls} htmlFor="lf-city">Property city</label>
            <input id="lf-city" className={fieldCls} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="lf-state">State</label>
            <input id="lf-state" maxLength={2} placeholder="CA" className={fieldCls + ' uppercase'} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
          </div>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 mt-3">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-5 inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-5 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
      >
        {status === 'sending'
          ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</>
          : <>Get my free quotes <ArrowRight size={16} aria-hidden="true" /></>}
      </button>
    </form>
  )
}
