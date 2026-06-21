'use client'

import { useMemo, useState } from 'react'
import { CalendarCheck, Wrench } from 'lucide-react'
import { BUILDING_TYPES, SYSTEM_TYPES } from '@/lib/constants'
import ResourceLeadForm from '@/components/ResourceLeadForm'

// Industry-standard commercial PM tasks. Base tasks apply to any system; system
// add-ons append where relevant. Cadence is typical guidance, not a code mandate.
const BASE_TASKS: { cadence: string; tasks: string[] }[] = [
  { cadence: 'Monthly / Quarterly', tasks: ['Replace or clean air filters', 'Visual inspection for leaks, noise, vibration', 'Check thermostats / controls and setpoints'] },
  { cadence: 'Semi-annual', tasks: ['Inspect & tighten electrical connections', 'Test safety controls and sensors', 'Clear and treat condensate drains', 'Inspect belts and motors'] },
  { cadence: 'Annual', tasks: ['Deep-clean condenser & evaporator coils', 'Check refrigerant charge and look for leaks', 'Full system tune-up and performance test', 'Verify economizer / outdoor-air operation'] },
]

const SYSTEM_ADDONS: Record<string, string[]> = {
  chilled_water: ['Annual chiller tube cleaning', 'Compressor oil analysis', 'Water-quality / glycol check'],
  cooling_tower: ['Water treatment & biocide program', 'Clean basin and fill', 'Check float and bleed-off'],
  boiler: ['Annual combustion analysis', 'Inspect heat exchanger', 'Test low-water cutoff & relief valve'],
  rtu: ['Inspect economizer dampers', 'Check curb/roof penetrations & seals'],
  vrf: ['Verify refrigerant piping & sensors', 'Update controller firmware / settings'],
  cooling_tower_default: [],
}

const visitCadence = (units: number) =>
  units >= 10 ? 'Monthly visits recommended' : units >= 4 ? 'Quarterly visits recommended' : 'Quarterly to semi-annual visits'

const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
    on ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300'
  }`

export default function MaintenancePlanBuilder() {
  const [buildingType, setBuildingType] = useState('office')
  const [systems, setSystems] = useState<Set<string>>(new Set(['rtu']))
  const [units, setUnits] = useState(4)

  const toggleSystem = (v: string) =>
    setSystems((prev) => {
      const next = new Set(prev)
      next.has(v) ? next.delete(v) : next.add(v)
      return next
    })

  const addons = useMemo(() => {
    const set = new Set<string>()
    systems.forEach((s) => (SYSTEM_ADDONS[s] ?? []).forEach((t) => set.add(t)))
    return Array.from(set)
  }, [systems])

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      {/* Inputs */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7 lg:sticky lg:top-6">
        <div className="flex items-center gap-2 mb-5">
          <Wrench size={18} className="text-primary-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutral-900">Your equipment</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="pm-building">Building type</label>
            <select id="pm-building" className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={buildingType} onChange={(e) => setBuildingType(e.target.value)}>
              {BUILDING_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <span className="block text-sm font-medium text-neutral-700 mb-2">System types</span>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_TYPES.map((s) => (
                <button key={s.value} type="button" onClick={() => toggleSystem(s.value)} className={chip(systems.has(s.value))}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="pm-units">Number of units</label>
            <input id="pm-units" type="number" min={1} value={units} onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))} className="w-full max-w-[140px] rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </div>

      {/* Plan output */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-2xl bg-primary-600 text-white p-5 flex items-center gap-3">
          <CalendarCheck size={20} aria-hidden="true" />
          <div>
            <div className="font-display text-lg font-bold">{visitCadence(units)}</div>
            <div className="text-sm text-primary-100">for {units} unit{units !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {BASE_TASKS.map((b) => (
          <div key={b.cadence} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-2">{b.cadence}</h3>
            <ul className="space-y-1.5 text-sm text-neutral-700 list-disc pl-5">
              {b.tasks.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        ))}

        {addons.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent-700 mb-2">System-specific tasks</h3>
            <ul className="space-y-1.5 text-sm text-neutral-700 list-disc pl-5">
              {addons.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">Get this plan set up</h3>
          <p className="text-sm text-neutral-600 mb-5">Have a vetted commercial HVAC contractor put this preventive-maintenance plan on a schedule and quote it.</p>
          <ResourceLeadForm source="maintenance-plan" ctaLabel="Get my maintenance plan quoted" note={`Built a PM plan: ${buildingType}, ${units} units, systems: ${Array.from(systems).join(', ')}`} />
        </div>
      </div>
    </div>
  )
}
