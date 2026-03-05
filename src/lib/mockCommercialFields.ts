/**
 * Shared commercial HVAC fields stub for mock contractor data.
 * Used by state/city/service pages so mock data satisfies the full Contractor type.
 */
export const MOCK_COMMERCIAL_FIELDS = {
  years_commercial_experience: 12,
  commercial_verified: true,
  system_types: ['rtu', 'split_system'],
  brands_serviced: ['Carrier', 'Trane'],
  tonnage_range_min: 5,
  tonnage_range_max: 200,
  building_types_served: ['office', 'retail', 'industrial'],
  emergency_response_minutes: 90,
  offers_24_7: false,
  sla_summary: null,
  multi_site_coverage: false,
  max_sites_supported: null,
  offers_service_agreements: true,
  service_agreement_types: ['preventive_maintenance'],
  dispatch_crm: null,
  avg_quote_turnaround_hours: 8,
  uses_gps_tracking: false,
  num_technicians: 10,
  num_nate_certified: 6,
  metro_area: null,
  slot_tier: null,
} as const
