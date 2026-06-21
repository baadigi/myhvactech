'use client'

import { useState } from 'react'
import { CheckCircle, Circle, FileDown, Download } from 'lucide-react'
import { buildRfpTemplate } from '@/lib/rfp-template'
import ResourceLeadForm from '@/components/ResourceLeadForm'

const CHECKLIST: { group: string; items: string[] }[] = [
  {
    group: 'Licensing & insurance',
    items: [
      'Active state contractor / mechanical license (verify the number)',
      'Certificate of insurance — general liability AND workers’ comp',
      'License covers commercial work, not just residential',
    ],
  },
  {
    group: 'Commercial experience',
    items: [
      'Documented experience with your system type (RTU, VRF, chiller, etc.)',
      '3+ references on similar commercial properties',
      'Manufacturer certifications (Carrier, Trane, Daikin, etc.)',
    ],
  },
  {
    group: 'The proposal',
    items: [
      'Itemized written quote (equipment, labor, crane/rigging, controls, permits)',
      'Equipment make/model and efficiency ratings specified',
      'Written warranty on parts AND labor',
      'Clear project timeline and payment schedule',
    ],
  },
  {
    group: 'Service & responsiveness',
    items: [
      'Emergency / after-hours response and typical response time',
      'Preventive-maintenance agreement available',
      'Single point of contact for the project',
    ],
  },
]

function downloadRfp() {
  const blob = new Blob([buildRfpTemplate()], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'commercial-hvac-rfp-template.txt'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ContractorChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const total = CHECKLIST.reduce((n, g) => n + g.items.length, 0)
  const done = checked.size

  return (
    <div className="grid lg:grid-cols-5 gap-6 items-start">
      {/* Checklist */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">Vetting checklist</h2>
          <span className="text-sm text-neutral-500">{done}/{total} checked</span>
        </div>
        <div className="space-y-6">
          {CHECKLIST.map((g) => (
            <div key={g.group}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-2">{g.group}</h3>
              <ul className="space-y-1.5">
                {g.items.map((item) => {
                  const key = `${g.group}:${item}`
                  const on = checked.has(key)
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="flex items-start gap-2.5 text-left w-full group"
                      >
                        {on
                          ? <CheckCircle size={18} className="text-accent-600 shrink-0 mt-0.5" aria-hidden="true" />
                          : <Circle size={18} className="text-neutral-300 group-hover:text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />}
                        <span className={`text-sm leading-relaxed ${on ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>{item}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* RFP download */}
      <div className="lg:col-span-2 lg:sticky lg:top-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <FileDown size={18} className="text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-neutral-900">Free RFP template</h2>
          </div>
          <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
            Send the same scope to every contractor so bids are apples-to-apples. Get the editable commercial HVAC RFP template — we&apos;ll email it and download it now.
          </p>
          <ResourceLeadForm
            source="rfp-template"
            ctaLabel="Get the RFP template"
            note="Downloaded the commercial HVAC RFP template"
            onSuccess={downloadRfp}
          />
          <button
            type="button"
            onClick={downloadRfp}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Download size={14} aria-hidden="true" /> Or download without email
          </button>
        </div>
      </div>
    </div>
  )
}
