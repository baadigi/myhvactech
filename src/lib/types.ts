export interface Contractor {
  id: string
  created_at: string
  updated_at: string
  owner_id: string | null
  company_name: string
  slug: string
  description: string | null
  short_description: string | null
  logo_url: string | null
  cover_image_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  street_address: string | null
  city: string
  state: string
  zip_code: string | null
  country: string
  location: unknown // PostGIS geography point
  service_radius_miles: number
  year_established: number | null
  license_number: string | null
  insurance_verified: boolean
  is_verified: boolean
  is_claimed: boolean
  is_featured: boolean
  operating_hours: Record<string, { open: string; close: string }> | null
  subscription_tier: 'free' | 'bronze' | 'silver' | 'gold'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string
  meta_title: string | null
  meta_description: string | null
  avg_rating: number
  review_count: number
  profile_views: number

  // ─── Commercial-specific fields ────────────────────────────
  years_commercial_experience: number | null
  commercial_verified: boolean
  system_types: string[]         // e.g. ['rtu','vrf','chilled_water']
  brands_serviced: string[]      // e.g. ['Carrier','Trane']
  tonnage_range_min: number | null
  tonnage_range_max: number | null
  building_types_served: string[] // e.g. ['office','retail','healthcare']
  emergency_response_minutes: number | null
  offers_24_7: boolean
  sla_summary: string | null
  multi_site_coverage: boolean
  max_sites_supported: number | null
  offers_service_agreements: boolean
  service_agreement_types: string[]
  dispatch_crm: string | null
  avg_quote_turnaround_hours: number | null
  uses_gps_tracking: boolean
  num_technicians: number | null
  num_nate_certified: number | null
  metro_area: string | null
  slot_tier: 'standard' | 'preferred' | 'exclusive' | null

  // ─── Google Business Profile ──────────────────────────────
  google_place_id?: string | null
  google_rating?: number | null
  google_review_count?: number
  google_reviews?: GoogleReview[]
  google_business_url?: string | null
  google_last_synced_at?: string | null
  google_phone?: string | null
  google_website?: string | null
  google_formatted_address?: string | null
  google_hours?: {
    open_now?: boolean
    weekday_text?: string[]
    periods?: { open: { day: number; time: string }; close?: { day: number; time: string } }[]
  } | null
  google_photos?: { photo_reference: string; width: number; height: number }[]
  google_business_status?: string | null
  google_editorial_summary?: string | null
  google_lat?: number | null
  google_lng?: number | null

  // ─── Relations ─────────────────────────────────────────────
  services?: Service[]
  service_areas?: ServiceArea[]
  reviews?: Review[]
  photos?: ContractorPhoto[]
  sample_projects?: SampleProject[]

  // Computed from PostGIS query
  distance_miles?: number
}

export interface Service {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  icon: string | null
}

export interface ServiceArea {
  id: string
  name: string
  slug: string
  city: string
  state: string
  state_abbr: string
  county: string | null
  population: number | null
  meta_title: string | null
  meta_description: string | null
}

export interface Review {
  id: string
  created_at: string
  contractor_id: string
  reviewer_id: string | null
  reviewer_name: string
  reviewer_company: string | null
  reviewer_title: string | null
  rating: number
  title: string | null
  body: string
  is_verified: boolean
  response: string | null
  response_date: string | null
  status: 'pending' | 'approved' | 'flagged' | 'removed'
  project_type: string | null
  building_type: string | null
}

export interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number  // Unix timestamp
  relative_time_description: string
  profile_photo_url: string | null
}

export interface ContractorPhoto {
  id: string
  contractor_id: string
  url: string
  caption: string | null
  category: 'project' | 'team' | 'equipment' | 'before_after'
  sort_order: number
  created_at: string
}

export interface SampleProject {
  id: string
  contractor_id: string
  created_at: string
  project_name: string
  building_type: string
  description: string | null
  square_footage: number | null
  tonnage: number | null
  system_type: string | null
  project_type: 'new_installation' | 'replacement' | 'retrofit' | 'repair' | 'maintenance_contract' | null
  completion_date: string | null
  project_value_range: string | null
  energy_savings_pct: number | null
  city: string | null
  state: string | null
  image_urls: string[]
  sort_order: number
}

export interface Lead {
  id: string
  created_at: string
  contractor_id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  service_needed: string | null
  message: string | null
  urgency: 'routine' | 'soon' | 'emergency'
  preferred_contact: 'email' | 'phone' | 'either'
  source: string
  landing_page: string | null
  status: 'new' | 'sent' | 'viewed' | 'responded' | 'closed'
  building_type: string | null
  property_sqft: number | null
  num_units_rtus: number | null
  budget_band: string | null
  timing: string | null
  quote_request_id: string | null
}

export interface QuoteRequest {
  id: string
  created_at: string
  requestor_name: string
  requestor_email: string
  requestor_phone: string | null
  requestor_title: string | null
  company_name: string | null
  building_type: string
  property_sqft: number | null
  num_buildings: number
  num_units_rtus: number | null
  system_types: string[]
  current_issues: string | null
  service_type: 'repair' | 'replacement' | 'new_install' | 'maintenance_agreement' | 'emergency' | 'energy_audit' | 'other'
  budget_band: string | null
  timing: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  metro_area: string | null
  assigned_contractor_ids: string[]
  max_contractors: number
  status: 'new' | 'routing' | 'sent' | 'viewed' | 'quoted' | 'won' | 'lost' | 'expired'
  routed_at: string | null
  expires_at: string | null
  source: string
  estimated_deal_value: number | null
}

export interface QuoteResponse {
  id: string
  created_at: string
  quote_request_id: string
  contractor_id: string
  message: string | null
  estimated_cost_min: number | null
  estimated_cost_max: number | null
  estimated_timeline: string | null
  available_start_date: string | null
  status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'
  viewed_at: string | null
  responded_at: string | null
}

export interface ClaimRequest {
  id: string
  created_at: string
  updated_at: string
  contractor_id: string
  user_id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  job_title: string | null
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  admin_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  // Joined fields
  contractor?: {
    company_name: string
    slug: string
    city: string
    state: string
    is_claimed: boolean
  }
}

export interface SearchParams {
  q?: string
  city?: string
  state?: string
  service?: string
  lat?: string
  lng?: string
  radius?: string
  page?: string
  // Commercial-specific filters
  buildingType?: string
  systemType?: string
  tonnageMin?: string
  tonnageMax?: string
  serviceAgreement?: string
  emergency24_7?: string
  multiSite?: string
}
