// Ballpark commercial HVAC cost model. These are INDUSTRY-STANDARD RANGES used to
// give facility managers a starting figure — not a quote. The tool's whole job is
// to push them to "get exact quotes from real contractors." Methodology is shown
// to the user; we never present a single precise number as fact.

export type ServiceKind = 'replacement' | 'new_install' | 'repair' | 'maintenance'

// Cooling load density: rough square-feet served per ton of cooling, by building
// type. Denser/heat-heavy uses (data centers, kitchens) need more tons per sq ft.
export const SQFT_PER_TON: Record<string, number> = {
  office: 400,
  retail: 350,
  industrial: 600, // warehouse-like, lighter cooling load
  healthcare: 300,
  education: 400,
  hospitality: 350,
  data_center: 150, // very high heat load
  multifamily: 450,
  government: 400,
  restaurant: 250, // kitchen heat load
  mixed_use: 375,
}

// Installed cost per ton (equipment + labor), low–high, by system type. Replacement
// and new installs use this; repair and maintenance use their own bases below.
const PER_TON: Record<string, [number, number]> = {
  rtu: [2000, 3500], // packaged rooftop units — most common, lowest cost
  split_system: [2500, 4000],
  heat_pump: [3000, 4500],
  ptac: [2200, 3800],
  ahu: [3000, 5000],
  vrf: [4000, 6500], // variable refrigerant flow — premium
  chilled_water: [4500, 8000], // chillers — highest
  cooling_tower: [3500, 6000],
  boiler: [2500, 5000], // heating basis, kept on the per-ton scale for simplicity
  geothermal: [5000, 9000],
}

const DEFAULT_PER_TON: [number, number] = [2500, 4500]

export interface CostInput {
  buildingType: string
  systemType: string
  serviceKind: ServiceKind
  squareFeet?: number | null
  tons?: number | null // if the user knows tonnage, it overrides the sqft estimate
}

export interface CostEstimate {
  low: number
  high: number
  tons: number
  perTonLow: number
  perTonHigh: number
  perSqftLow: number | null
  perSqftHigh: number | null
  basis: string // human-readable explanation for the methodology line
}

function round(n: number, step: number): number {
  return Math.round(n / step) * step
}

export function estimateCost(input: CostInput): CostEstimate | null {
  const { buildingType, systemType, serviceKind, squareFeet, tons: tonsIn } = input

  // Derive tonnage from square feet + building type, unless given directly.
  const density = SQFT_PER_TON[buildingType] ?? 400
  const tons = tonsIn && tonsIn > 0
    ? tonsIn
    : squareFeet && squareFeet > 0
      ? Math.max(1, squareFeet / density)
      : 0

  if (tons <= 0) return null

  const [ptLow, ptHigh] = PER_TON[systemType] ?? DEFAULT_PER_TON

  if (serviceKind === 'maintenance') {
    // Preventive maintenance contract: priced per unit/ton per year, not equipment cost.
    const low = round(tons * 120, 50)
    const high = round(tons * 280, 50)
    return {
      low, high, tons,
      perTonLow: 120, perTonHigh: 280,
      perSqftLow: null, perSqftHigh: null,
      basis: `Annual preventive-maintenance contract, roughly $120–$280 per ton of capacity (${tons.toFixed(0)} tons).`,
    }
  }

  if (serviceKind === 'repair') {
    // Repairs scale loosely with system size, but are far smaller than replacement.
    const low = round(350 + tons * 60, 25)
    const high = round(1200 + tons * 180, 25)
    return {
      low, high, tons,
      perTonLow: 60, perTonHigh: 180,
      perSqftLow: null, perSqftHigh: null,
      basis: `Typical commercial repair: service call plus parts/labor scaled to system size (${tons.toFixed(0)} tons). Major component failures run higher.`,
    }
  }

  // replacement / new_install — full installed equipment cost
  const low = round(tons * ptLow, 100)
  const high = round(tons * ptHigh, 100)
  const perSqftLow = squareFeet && squareFeet > 0 ? Math.round((low / squareFeet) * 10) / 10 : null
  const perSqftHigh = squareFeet && squareFeet > 0 ? Math.round((high / squareFeet) * 10) / 10 : null

  return {
    low, high, tons,
    perTonLow: ptLow, perTonHigh: ptHigh,
    perSqftLow, perSqftHigh,
    basis: `${serviceKind === 'new_install' ? 'New installation' : 'Replacement'} of ~${tons.toFixed(0)} tons at $${ptLow.toLocaleString()}–$${ptHigh.toLocaleString()} per ton installed for this system type.`,
  }
}

export function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
