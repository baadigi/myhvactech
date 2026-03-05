'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'
import { Button } from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportError {
  row: number
  error: string
}

type Step = 'upload' | 'mapping' | 'preview' | 'import'

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'upload', label: 'Upload CSV', num: 1 },
  { key: 'mapping', label: 'Map Columns', num: 2 },
  { key: 'preview', label: 'Preview', num: 3 },
  { key: 'import', label: 'Import', num: 4 },
]

// ─── Contractor field definitions ─────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  required?: boolean
  group: string
}

const CONTRACTOR_FIELDS: FieldDef[] = [
  // Required
  { key: 'company_name', label: 'Company Name', required: true, group: 'Basic' },
  { key: 'city', label: 'City', required: true, group: 'Basic' },
  { key: 'state', label: 'State', required: true, group: 'Basic' },
  // Contact
  { key: 'phone', label: 'Phone', group: 'Contact' },
  { key: 'email', label: 'Email', group: 'Contact' },
  { key: 'website', label: 'Website', group: 'Contact' },
  // Address
  { key: 'street_address', label: 'Street Address', group: 'Address' },
  { key: 'zip_code', label: 'ZIP Code', group: 'Address' },
  { key: 'metro_area', label: 'Metro Area', group: 'Address' },
  // Details
  { key: 'description', label: 'Description', group: 'Details' },
  { key: 'short_description', label: 'Short Description', group: 'Details' },
  { key: 'license_number', label: 'License Number', group: 'Details' },
  { key: 'year_established', label: 'Year Established', group: 'Details' },
  // Services (arrays — comma-separated in CSV)
  { key: 'system_types', label: 'System Types (comma-separated)', group: 'Services' },
  { key: 'building_types_served', label: 'Building Types (comma-separated)', group: 'Services' },
  { key: 'brands_serviced', label: 'Brands Serviced (comma-separated)', group: 'Services' },
  // Capacity
  { key: 'tonnage_range_min', label: 'Tonnage Range Min', group: 'Capacity' },
  { key: 'tonnage_range_max', label: 'Tonnage Range Max', group: 'Capacity' },
  { key: 'service_radius_miles', label: 'Service Radius (miles)', group: 'Capacity' },
  // Staff
  { key: 'num_technicians', label: '# Technicians', group: 'Staff' },
  { key: 'num_nate_certified', label: '# NATE Certified', group: 'Staff' },
  { key: 'emergency_response_minutes', label: 'Emergency Response (min)', group: 'Staff' },
  { key: 'years_commercial_experience', label: 'Years Commercial Exp.', group: 'Staff' },
  // Booleans
  { key: 'offers_24_7', label: 'Offers 24/7', group: 'Features' },
  { key: 'multi_site_coverage', label: 'Multi-Site Coverage', group: 'Features' },
  { key: 'offers_service_agreements', label: 'Offers Service Agreements', group: 'Features' },
  { key: 'is_verified', label: 'Is Verified', group: 'Features' },
  { key: 'commercial_verified', label: 'Commercial Verified', group: 'Features' },
]

const REQUIRED_FIELDS = CONTRACTOR_FIELDS.filter((f) => f.required).map((f) => f.key)

// ─── CSV Parser (handles quoted fields with commas) ───────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          // Escaped quote
          field += '"'
          i++
        } else {
          // End of quoted field
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"' && field.length === 0) {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field)
        field = ''
        if (current.some((c) => c.trim() !== '')) {
          lines.push(current)
        }
        current = []
        if (ch === '\r') i++ // skip \n after \r
      } else if (ch === '\r') {
        current.push(field)
        field = ''
        if (current.some((c) => c.trim() !== '')) {
          lines.push(current)
        }
        current = []
      } else {
        field += ch
      }
    }
  }

  // Last field / last line
  current.push(field)
  if (current.some((c) => c.trim() !== '')) {
    lines.push(current)
  }

  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].map((h) => h.trim())
  const rows = lines.slice(1)

  return { headers, rows }
}

// ─── Auto-match logic ─────────────────────────────────────────────────────────

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function autoMatchColumn(csvHeader: string): string {
  const norm = normalizeForMatch(csvHeader)

  // Direct match on key
  for (const f of CONTRACTOR_FIELDS) {
    if (normalizeForMatch(f.key) === norm) return f.key
  }

  // Match on label
  for (const f of CONTRACTOR_FIELDS) {
    if (normalizeForMatch(f.label) === norm) return f.key
  }

  // Partial / alias matches
  const aliases: Record<string, string[]> = {
    company_name: ['company', 'companyname', 'businessname', 'business', 'name'],
    city: ['city', 'town'],
    state: ['state', 'st', 'province'],
    phone: ['phone', 'telephone', 'phonenumber', 'tel'],
    email: ['email', 'emailaddress', 'mail'],
    website: ['website', 'url', 'web', 'site', 'homepage'],
    street_address: ['streetaddress', 'address', 'street', 'addr', 'address1'],
    zip_code: ['zipcode', 'zip', 'postalcode', 'postal'],
    description: ['description', 'desc', 'about', 'bio'],
    short_description: ['shortdescription', 'shortdesc', 'summary', 'tagline'],
    license_number: ['licensenumber', 'license', 'licnum', 'lic'],
    year_established: ['yearestablished', 'founded', 'established', 'year', 'since'],
    system_types: ['systemtypes', 'systems', 'hvactypes'],
    building_types_served: ['buildingtypes', 'buildingtype', 'buildingtypesserved'],
    brands_serviced: ['brandsserviced', 'brands', 'brand'],
    metro_area: ['metroarea', 'metro', 'region'],
    tonnage_range_min: ['tonnagerangemin', 'tonnagemin', 'mintonnage'],
    tonnage_range_max: ['tonnagerangemax', 'tonnagemax', 'maxtonnage'],
    service_radius_miles: ['serviceradiusmiles', 'serviceradius', 'radius'],
    num_technicians: ['numtechnicians', 'technicians', 'techs', 'numtechs'],
    num_nate_certified: ['numnatecertified', 'natecertified', 'nate'],
    emergency_response_minutes: ['emergencyresponseminutes', 'emergencyresponse', 'responsetime'],
    years_commercial_experience: ['yearscommercialexperience', 'commercialexperience', 'commercialyears'],
    offers_24_7: ['offers247', '247', 'twentyfourhour', 'allhours'],
    multi_site_coverage: ['multisitecoverage', 'multisite'],
    offers_service_agreements: ['offersserviceagreements', 'serviceagreements'],
    is_verified: ['isverified', 'verified'],
    commercial_verified: ['commercialverified', 'commercialcert'],
  }

  for (const [fieldKey, alts] of Object.entries(aliases)) {
    if (alts.includes(norm)) return fieldKey
  }

  return '' // no match
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminImportPage() {
  // Global state
  const [step, setStep] = useState<Step>('upload')

  // Step 1: Upload
  const [fileName, setFileName] = useState<string | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2: Mapping
  const [columnMap, setColumnMap] = useState<Record<number, string>>({})

  // Step 4: Import
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importDone, setImportDone] = useState(false)

  // ── File handling ───────────────────────────────────
  const processFile = useCallback((file: File) => {
    setParseError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text || text.trim().length === 0) {
        setParseError('File is empty')
        return
      }
      const { headers, rows } = parseCSV(text)
      if (headers.length === 0) {
        setParseError('No headers found in CSV')
        return
      }
      if (rows.length === 0) {
        setParseError('No data rows found in CSV')
        return
      }

      setCsvHeaders(headers)
      setCsvRows(rows)

      // Auto-match columns
      const map: Record<number, string> = {}
      headers.forEach((h, i) => {
        const match = autoMatchColumn(h)
        if (match) map[i] = match
      })
      setColumnMap(map)
    }
    reader.onerror = () => setParseError('Failed to read file')
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // ── Mapping helpers ─────────────────────────────────
  const updateMapping = (colIdx: number, fieldKey: string) => {
    setColumnMap((prev) => {
      const next = { ...prev }
      if (fieldKey === '') {
        delete next[colIdx]
      } else {
        // Remove any existing mapping to this field
        for (const k of Object.keys(next)) {
          if (next[Number(k)] === fieldKey) {
            delete next[Number(k)]
          }
        }
        next[colIdx] = fieldKey
      }
      return next
    })
  }

  const mappedFieldKeys = new Set(Object.values(columnMap))
  const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedFieldKeys.has(f))

  // ── Build mapped rows for preview / import ──────────
  const getMappedRows = useCallback((): Record<string, string>[] => {
    return csvRows.map((row) => {
      const obj: Record<string, string> = {}
      for (const [colIdxStr, fieldKey] of Object.entries(columnMap)) {
        const colIdx = Number(colIdxStr)
        const value = row[colIdx]?.trim() ?? ''
        if (value) obj[fieldKey] = value
      }
      return obj
    })
  }, [csvRows, columnMap])

  const previewRows = step === 'preview' || step === 'import' ? getMappedRows() : []
  const rowsWithIssues =
    step === 'preview' || step === 'import'
      ? previewRows.filter(
          (r) => !r.company_name?.trim() || !r.city?.trim() || !r.state?.trim()
        ).length
      : 0

  // ── Import logic ────────────────────────────────────
  const BATCH_SIZE = 50

  const startImport = async () => {
    const allRows = getMappedRows()
    setImporting(true)
    setImportDone(false)
    setImportedCount(0)
    setImportErrors([])
    setImportTotal(allRows.length)
    setImportProgress(0)

    let totalImported = 0
    const allErrors: ImportError[] = []

    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE)

      try {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        })

        const data = await res.json()

        if (!res.ok) {
          // Whole batch failed
          allErrors.push({
            row: i + 1,
            error: data.error || `Batch failed with status ${res.status}`,
          })
        } else {
          totalImported += data.imported ?? 0
          if (data.errors) {
            // Adjust row numbers to be relative to full dataset
            for (const err of data.errors as ImportError[]) {
              allErrors.push({ row: err.row + i, error: err.error })
            }
          }
        }
      } catch (err) {
        allErrors.push({
          row: i + 1,
          error: `Network error: ${err instanceof Error ? err.message : 'Unknown'}`,
        })
      }

      setImportProgress(Math.min(i + BATCH_SIZE, allRows.length))
      setImportedCount(totalImported)
      setImportErrors([...allErrors])
    }

    setImportProgress(allRows.length)
    setImportDone(true)
    setImporting(false)
  }

  const resetAll = () => {
    setStep('upload')
    setFileName(null)
    setCsvHeaders([])
    setCsvRows([])
    setParseError(null)
    setColumnMap({})
    setImporting(false)
    setImportProgress(0)
    setImportTotal(0)
    setImportedCount(0)
    setImportErrors([])
    setImportDone(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Rendered fields used in mapping ─────────────────
  const groupedFields = CONTRACTOR_FIELDS.reduce<Record<string, FieldDef[]>>((acc, f) => {
    if (!acc[f.group]) acc[f.group] = []
    acc[f.group].push(f)
    return acc
  }, {})

  // ── Render ──────────────────────────────────────────
  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Bulk Import</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Import contractors from a CSV file
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isActive = step === s.key
            const stepIdx = STEPS.findIndex((x) => x.key === step)
            const isCompleted = i < stepIdx

            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`hidden sm:block w-8 h-px ${
                      isCompleted ? 'bg-[#134a8a]' : 'bg-neutral-200'
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-[#134a8a] text-white'
                        : isCompleted
                        ? 'bg-[#134a8a]/10 text-[#134a8a]'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      isActive
                        ? 'text-[#134a8a]'
                        : isCompleted
                        ? 'text-neutral-700'
                        : 'text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── STEP 1: Upload ─────────────────────────── */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            Upload CSV File
          </h3>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-[#134a8a] bg-[#134a8a]/5'
                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  or click to browse files
                </p>
              </div>
            </div>
          </div>

          {parseError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-[#c83518] font-medium">{parseError}</p>
            </div>
          )}

          {fileName && csvRows.length > 0 && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                      aria-hidden="true"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{fileName}</p>
                    <p className="text-xs text-neutral-500">
                      {csvRows.length} data row{csvRows.length !== 1 ? 's' : ''} &middot;{' '}
                      {csvHeaders.length} column{csvHeaders.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep('mapping')}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 2: Column Mapping ─────────────────── */}
      {step === 'mapping' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Map Columns</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Match each CSV column to a contractor field
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('preview')}
                disabled={missingRequired.length > 0}
              >
                Continue
              </Button>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-600 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Required fields not mapped
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {missingRequired
                    .map(
                      (k) =>
                        CONTRACTOR_FIELDS.find((f) => f.key === k)?.label ?? k
                    )
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 uppercase tracking-wide w-1/3">
                    CSV Column
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    →
                  </th>
                  <th className="text-left py-2 text-xs font-medium text-neutral-500 uppercase tracking-wide w-1/2">
                    Contractor Field
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvHeaders.map((header, idx) => {
                  const mapped = columnMap[idx] ?? ''
                  const fieldDef = CONTRACTOR_FIELDS.find((f) => f.key === mapped)
                  const isRequired = fieldDef?.required ?? false

                  return (
                    <tr
                      key={idx}
                      className="border-b border-neutral-50 hover:bg-neutral-50/50"
                    >
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-neutral-100 rounded text-xs font-mono text-neutral-700">
                          {header}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={mapped ? 'text-green-500' : 'text-neutral-300'}
                          aria-hidden="true"
                        >
                          <line x1="5" x2="19" y1="12" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={mapped}
                            onChange={(e) => updateMapping(idx, e.target.value)}
                            className={`w-full h-8 px-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#134a8a]/30 focus:border-[#134a8a] cursor-pointer ${
                              mapped
                                ? 'border-green-300 text-neutral-900'
                                : 'border-neutral-200 text-neutral-400'
                            }`}
                          >
                            <option value="">— Skip this column —</option>
                            {Object.entries(groupedFields).map(([group, fields]) => (
                              <optgroup key={group} label={group}>
                                {fields.map((f) => {
                                  const alreadyMapped =
                                    mappedFieldKeys.has(f.key) && columnMap[idx] !== f.key
                                  return (
                                    <option
                                      key={f.key}
                                      value={f.key}
                                      disabled={alreadyMapped}
                                    >
                                      {f.label}
                                      {f.required ? ' *' : ''}
                                      {alreadyMapped ? ' (already mapped)' : ''}
                                    </option>
                                  )
                                })}
                              </optgroup>
                            ))}
                          </select>
                          {isRequired && (
                            <span className="text-[10px] font-bold text-[#c83518] uppercase tracking-wide flex-shrink-0">
                              REQ
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              {Object.keys(columnMap).length} of {csvHeaders.length} columns mapped
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('preview')}
              disabled={missingRequired.length > 0}
            >
              Continue to Preview
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Preview ────────────────────────── */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Preview Data</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review the first 10 rows before importing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('import')}
              >
                Continue to Import
              </Button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Total rows:</span>
              <span className="text-sm font-semibold text-neutral-900">
                {previewRows.length}
              </span>
            </div>
            <div className="w-px h-4 bg-neutral-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Fields mapped:</span>
              <span className="text-sm font-semibold text-neutral-900">
                {Object.keys(columnMap).length}
              </span>
            </div>
            {rowsWithIssues > 0 && (
              <>
                <div className="w-px h-4 bg-neutral-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#c83518]">Rows with issues:</span>
                  <span className="text-sm font-semibold text-[#c83518]">
                    {rowsWithIssues}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wide border-b border-neutral-200">
                    #
                  </th>
                  {Object.values(columnMap).map((fieldKey) => {
                    const def = CONTRACTOR_FIELDS.find((f) => f.key === fieldKey)
                    return (
                      <th
                        key={fieldKey}
                        className="text-left py-2 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wide border-b border-neutral-200 whitespace-nowrap"
                      >
                        {def?.label ?? fieldKey}
                        {def?.required && (
                          <span className="text-[#c83518] ml-0.5">*</span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 10).map((row, i) => {
                  const hasIssue =
                    !row.company_name?.trim() ||
                    !row.city?.trim() ||
                    !row.state?.trim()

                  return (
                    <tr
                      key={i}
                      className={
                        hasIssue
                          ? 'bg-red-50/50 hover:bg-red-50'
                          : 'hover:bg-neutral-50'
                      }
                    >
                      <td
                        className={`py-2 px-3 text-xs border-b ${
                          hasIssue
                            ? 'text-[#c83518] font-bold border-red-100'
                            : 'text-neutral-400 border-neutral-100'
                        }`}
                      >
                        {i + 1}
                      </td>
                      {Object.values(columnMap).map((fieldKey) => {
                        const val = row[fieldKey] ?? ''
                        const isMissing =
                          REQUIRED_FIELDS.includes(fieldKey) && !val.trim()

                        return (
                          <td
                            key={fieldKey}
                            className={`py-2 px-3 text-sm border-b max-w-48 truncate ${
                              isMissing
                                ? 'text-[#c83518] font-medium border-red-100'
                                : hasIssue
                                ? 'text-neutral-700 border-red-100'
                                : 'text-neutral-700 border-neutral-100'
                            }`}
                          >
                            {isMissing ? (
                              <span className="italic">Missing</span>
                            ) : (
                              val || <span className="text-neutral-300">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {previewRows.length > 10 && (
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Showing 10 of {previewRows.length} rows
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('import')}
            >
              Continue to Import
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Import ─────────────────────────── */}
      {step === 'import' && (
        <div className="space-y-4">
          {/* Import action card */}
          {!importDone && !importing && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                Ready to Import
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                {previewRows.length} row{previewRows.length !== 1 ? 's' : ''} will be
                imported in batches of {BATCH_SIZE}.
                {rowsWithIssues > 0 && (
                  <span className="text-[#c83518]">
                    {' '}
                    {rowsWithIssues} row{rowsWithIssues !== 1 ? 's' : ''} have missing
                    required fields and will be skipped.
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep('preview')}>
                  Back
                </Button>
                <Button variant="primary" size="sm" onClick={startImport}>
                  Start Import
                </Button>
              </div>
            </div>
          )}

          {/* Progress */}
          {(importing || importDone) && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {importDone ? 'Import Complete' : 'Importing...'}
                </h3>
                <span className="text-xs text-neutral-500">
                  {importProgress} of {importTotal} rows processed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-4">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    importDone
                      ? importErrors.length > 0
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                      : 'bg-[#134a8a]'
                  }`}
                  style={{
                    width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-neutral-700">
                    <span className="font-semibold">{importedCount}</span> imported
                  </span>
                </div>
                {importErrors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#c83518]" />
                    <span className="text-sm text-neutral-700">
                      <span className="font-semibold">{importErrors.length}</span> error
                      {importErrors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Final summary */}
              {importDone && (
                <div
                  className={`p-4 rounded-lg border ${
                    importErrors.length === 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {importErrors.length === 0 ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-600 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          importErrors.length === 0 ? 'text-green-800' : 'text-amber-800'
                        }`}
                      >
                        {importErrors.length === 0
                          ? `All ${importedCount} contractors imported successfully!`
                          : `Imported ${importedCount} contractors with ${importErrors.length} error${importErrors.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {importDone && (
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={resetAll}>
                    Import Another File
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Error log */}
          {importErrors.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Error Log
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {importErrors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-red-50/50 rounded-lg text-sm"
                  >
                    <span className="text-[#c83518] font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                      Row {err.row}
                    </span>
                    <span className="text-neutral-700 text-xs">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
