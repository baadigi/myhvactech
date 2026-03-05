export const SITE_NAME = 'My HVAC Tech'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myhvactech.com'
export const SITE_DESCRIPTION = 'The commercial HVAC marketplace for property and facility managers. Find vetted contractors by building type, system, and service — not homeowners, not residential.'

export const SITE_TAGLINE = 'Commercial HVAC. Vetted Contractors. Real Results.'

// ─── Building Types ──────────────────────────────────────────────────────────

export const BUILDING_TYPES = [
  { value: 'office', label: 'Office Building', icon: 'Building2' },
  { value: 'retail', label: 'Retail / Shopping Center', icon: 'Store' },
  { value: 'industrial', label: 'Industrial / Warehouse', icon: 'Factory' },
  { value: 'healthcare', label: 'Healthcare / Medical', icon: 'HeartPulse' },
  { value: 'education', label: 'Education / Campus', icon: 'GraduationCap' },
  { value: 'hospitality', label: 'Hospitality / Hotel', icon: 'Bed' },
  { value: 'data_center', label: 'Data Center', icon: 'Server' },
  { value: 'multifamily', label: 'Multifamily (50+ units)', icon: 'Building' },
  { value: 'government', label: 'Government / Municipal', icon: 'Landmark' },
  { value: 'restaurant', label: 'Restaurant / Food Service', icon: 'Utensils' },
  { value: 'mixed_use', label: 'Mixed Use', icon: 'Layers' },
] as const

export type BuildingType = (typeof BUILDING_TYPES)[number]['value']

// ─── System Types ────────────────────────────────────────────────────────────

export const SYSTEM_TYPES = [
  { value: 'rtu', label: 'Rooftop Unit (RTU)' },
  { value: 'vrf', label: 'VRF / VRV System' },
  { value: 'chilled_water', label: 'Chilled Water / Chiller' },
  { value: 'split_system', label: 'Split System' },
  { value: 'boiler', label: 'Boiler' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'ahu', label: 'Air Handling Unit (AHU)' },
  { value: 'cooling_tower', label: 'Cooling Tower' },
  { value: 'ptac', label: 'PTAC / PTHP' },
  { value: 'geothermal', label: 'Geothermal' },
] as const

export type SystemType = (typeof SYSTEM_TYPES)[number]['value']

// ─── Budget Bands ────────────────────────────────────────────────────────────

export const BUDGET_BANDS = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_15k', label: '$5,000 – $15,000' },
  { value: '15k_50k', label: '$15,000 – $50,000' },
  { value: '50k_100k', label: '$50,000 – $100,000' },
  { value: '100k_250k', label: '$100,000 – $250,000' },
  { value: '250k_plus', label: '$250,000+' },
  { value: 'not_sure', label: 'Not sure yet' },
] as const

export type BudgetBand = (typeof BUDGET_BANDS)[number]['value']

// ─── Timing Options ──────────────────────────────────────────────────────────

export const TIMING_OPTIONS = [
  { value: 'emergency_now', label: 'Emergency — Right Now', description: 'System down, need immediate help' },
  { value: 'this_week', label: 'This Week', description: 'Urgent but not an emergency' },
  { value: 'this_month', label: 'This Month', description: 'Planning a near-term project' },
  { value: 'this_quarter', label: 'This Quarter', description: 'Budgeted project, flexible timing' },
  { value: 'planning_ahead', label: 'Planning Ahead', description: 'Exploring options for future work' },
] as const

export type TimingOption = (typeof TIMING_OPTIONS)[number]['value']

// ─── Service Types (for quote request) ───────────────────────────────────────

export const SERVICE_TYPES = [
  { value: 'repair', label: 'Repair / Troubleshooting' },
  { value: 'replacement', label: 'Equipment Replacement' },
  { value: 'new_install', label: 'New Installation' },
  { value: 'maintenance_agreement', label: 'Maintenance Agreement' },
  { value: 'emergency', label: 'Emergency Service' },
  { value: 'energy_audit', label: 'Energy Audit / Retrofit' },
  { value: 'other', label: 'Other' },
] as const

// ─── Service Agreement Types ─────────────────────────────────────────────────

export const SERVICE_AGREEMENT_TYPES = [
  { value: 'preventive_maintenance', label: 'Preventive Maintenance' },
  { value: 'full_service', label: 'Full Service (Parts + Labor)' },
  { value: 'parts_labor', label: 'Parts & Labor Warranty' },
  { value: 'emergency_only', label: 'Emergency-Only Coverage' },
] as const

// ─── Dispatch CRM Options ────────────────────────────────────────────────────

export const DISPATCH_CRM_OPTIONS = [
  'ServiceTitan',
  'BuildOps',
  'FieldEdge',
  'Housecall Pro',
  'Service Fusion',
  'Jobber',
  'mHelpDesk',
  'Other',
] as const

// ─── Brands Serviced ─────────────────────────────────────────────────────────

export const HVAC_BRANDS = [
  'Carrier', 'Trane', 'Daikin', 'Lennox', 'York', 'Mitsubishi',
  'Johnson Controls', 'McQuay', 'Rheem/Ruud', 'Goodman/Amana',
  'Bosch', 'Honeywell', 'Bard', 'Aaon', 'Heil',
] as const

// ─── HVAC Services (unchanged from v1) ──────────────────────────────────────

export const HVAC_SERVICES = [
  { name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair' },
  { name: 'Commercial AC Installation', slug: 'commercial-ac-installation', category: 'Installation' },
  { name: 'Commercial Heating Repair', slug: 'commercial-heating-repair', category: 'Repair' },
  { name: 'Commercial Heating Installation', slug: 'commercial-heating-installation', category: 'Installation' },
  { name: 'Rooftop Unit (RTU) Service', slug: 'rooftop-unit-service', category: 'Maintenance' },
  { name: 'Chiller Repair & Maintenance', slug: 'chiller-repair-maintenance', category: 'Maintenance' },
  { name: 'Boiler Service', slug: 'boiler-service', category: 'Maintenance' },
  { name: 'Ductwork Installation & Repair', slug: 'ductwork-installation-repair', category: 'Installation' },
  { name: 'Commercial Refrigeration', slug: 'commercial-refrigeration', category: 'Installation' },
  { name: 'Preventive Maintenance Plans', slug: 'preventive-maintenance-plans', category: 'Maintenance' },
  { name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency' },
  { name: 'Building Automation Systems', slug: 'building-automation-systems', category: 'Installation' },
  { name: 'Indoor Air Quality', slug: 'indoor-air-quality', category: 'Maintenance' },
  { name: 'Energy Audits & Retrofits', slug: 'energy-audits-retrofits', category: 'Maintenance' },
  { name: 'VRF/VRV Systems', slug: 'vrf-vrv-systems', category: 'Installation' },
] as const

// ─── Subscription Tiers (updated for slot/lead model) ───────────────────────

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price_monthly: 0,
    price_annual: 0,
    features: [
      'Basic directory listing',
      'Up to 3 photos',
      '1 service area',
      'Email lead notifications',
    ],
    max_leads_month: 5,
  },
  bronze: {
    name: 'Bronze',
    price_monthly: 4900,
    price_annual: 46800,
    features: [
      'Enhanced listing with project portfolio',
      'Up to 10 photos & 3 sample projects',
      '3 service areas',
      'Email + SMS notifications',
      'Respond to reviews',
      'Basic analytics',
    ],
    max_leads_month: 20,
  },
  silver: {
    name: 'Silver',
    price_monthly: 14900,
    price_annual: 142800,
    features: [
      'Priority listing in search results',
      'Up to 25 photos & 10 sample projects',
      '10 service areas',
      'Real-time notifications',
      'Full analytics dashboard',
      'Commercial Verified badge',
      'Booking calendar',
    ],
    max_leads_month: 50,
  },
  gold: {
    name: 'Gold',
    price_monthly: 34900,
    price_annual: 334800,
    features: [
      'Featured placement + market slot priority',
      'Unlimited photos & sample projects',
      'Unlimited service areas',
      'Real-time + CRM webhook integration',
      'Advanced analytics + company IP lookup',
      'Commercial Verified badge',
      'Quote auto-response',
      'Dedicated account manager',
    ],
    max_leads_month: -1, // unlimited
  },
} as const

// ─── US States (unchanged) ──────────────────────────────────────────────────

export const US_STATES = [
  { name: 'Alabama', abbr: 'AL' },
  { name: 'Alaska', abbr: 'AK' },
  { name: 'Arizona', abbr: 'AZ' },
  { name: 'Arkansas', abbr: 'AR' },
  { name: 'California', abbr: 'CA' },
  { name: 'Colorado', abbr: 'CO' },
  { name: 'Connecticut', abbr: 'CT' },
  { name: 'Delaware', abbr: 'DE' },
  { name: 'Florida', abbr: 'FL' },
  { name: 'Georgia', abbr: 'GA' },
  { name: 'Hawaii', abbr: 'HI' },
  { name: 'Idaho', abbr: 'ID' },
  { name: 'Illinois', abbr: 'IL' },
  { name: 'Indiana', abbr: 'IN' },
  { name: 'Iowa', abbr: 'IA' },
  { name: 'Kansas', abbr: 'KS' },
  { name: 'Kentucky', abbr: 'KY' },
  { name: 'Louisiana', abbr: 'LA' },
  { name: 'Maine', abbr: 'ME' },
  { name: 'Maryland', abbr: 'MD' },
  { name: 'Massachusetts', abbr: 'MA' },
  { name: 'Michigan', abbr: 'MI' },
  { name: 'Minnesota', abbr: 'MN' },
  { name: 'Mississippi', abbr: 'MS' },
  { name: 'Missouri', abbr: 'MO' },
  { name: 'Montana', abbr: 'MT' },
  { name: 'Nebraska', abbr: 'NE' },
  { name: 'Nevada', abbr: 'NV' },
  { name: 'New Hampshire', abbr: 'NH' },
  { name: 'New Jersey', abbr: 'NJ' },
  { name: 'New Mexico', abbr: 'NM' },
  { name: 'New York', abbr: 'NY' },
  { name: 'North Carolina', abbr: 'NC' },
  { name: 'North Dakota', abbr: 'ND' },
  { name: 'Ohio', abbr: 'OH' },
  { name: 'Oklahoma', abbr: 'OK' },
  { name: 'Oregon', abbr: 'OR' },
  { name: 'Pennsylvania', abbr: 'PA' },
  { name: 'Rhode Island', abbr: 'RI' },
  { name: 'South Carolina', abbr: 'SC' },
  { name: 'South Dakota', abbr: 'SD' },
  { name: 'Tennessee', abbr: 'TN' },
  { name: 'Texas', abbr: 'TX' },
  { name: 'Utah', abbr: 'UT' },
  { name: 'Vermont', abbr: 'VT' },
  { name: 'Virginia', abbr: 'VA' },
  { name: 'Washington', abbr: 'WA' },
  { name: 'West Virginia', abbr: 'WV' },
  { name: 'Wisconsin', abbr: 'WI' },
  { name: 'Wyoming', abbr: 'WY' },
] as const
