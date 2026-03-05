-- ============================================
-- MY HVAC TECH — Seed Data (Commercial-Realistic)
-- supabase/seed.sql
-- ============================================

-- ============================================
-- SERVICES (15 total)
-- ============================================
INSERT INTO services (id, name, slug, category, description, icon) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Commercial AC Repair', 'commercial-ac-repair', 'Repair', 'Expert repair services for commercial air conditioning systems including rooftop units, split systems, and VRF/VRV equipment.', 'wrench'),
  ('11111111-0000-0000-0000-000000000002', 'Commercial AC Installation', 'commercial-ac-installation', 'Installation', 'Full installation of commercial cooling systems — from packaged rooftop units to complex chilled water systems.', 'tool'),
  ('11111111-0000-0000-0000-000000000003', 'Rooftop Unit (RTU) Service', 'rooftop-unit-service', 'Maintenance', 'Comprehensive service and maintenance for packaged rooftop HVAC units including inspection, cleaning, and parts replacement.', 'building'),
  ('11111111-0000-0000-0000-000000000004', 'Emergency HVAC Service', 'emergency-hvac-service', 'Emergency', '24/7 emergency HVAC repair and response for commercial buildings. Minimize downtime with rapid dispatch and certified technicians.', 'zap'),
  ('11111111-0000-0000-0000-000000000005', 'Preventive Maintenance Plans', 'preventive-maintenance-plans', 'Maintenance', 'Scheduled maintenance programs to keep commercial HVAC systems running efficiently and prevent costly breakdowns.', 'calendar'),
  ('11111111-0000-0000-0000-000000000006', 'Chiller Repair & Maintenance', 'chiller-repair-maintenance', 'Maintenance', 'Specialized service for centrifugal, screw, and scroll chillers in large commercial and industrial facilities.', 'thermometer'),
  ('11111111-0000-0000-0000-000000000007', 'Boiler Service', 'boiler-service', 'Maintenance', 'Commercial boiler installation, repair, and annual tune-up services. Certified on all major boiler brands.', 'flame'),
  ('11111111-0000-0000-0000-000000000008', 'Ductwork Installation & Repair', 'ductwork-installation-repair', 'Installation', 'Design, fabrication, and installation of sheet metal ductwork systems for commercial buildings of all sizes.', 'wind'),
  ('11111111-0000-0000-0000-000000000009', 'Building Automation Systems', 'building-automation-systems', 'Installation', 'BAS/BMS installation and integration for smart building controls, energy management, and remote monitoring.', 'cpu'),
  ('11111111-0000-0000-0000-000000000010', 'Indoor Air Quality', 'indoor-air-quality', 'Maintenance', 'IAQ assessments, air purification systems, UV germicidal lighting, and ventilation improvements for healthier workplaces.', 'wind'),
  ('11111111-0000-0000-0000-000000000011', 'Commercial Heating Repair', 'commercial-heating-repair', 'Repair', 'Fast, reliable repair for commercial heating systems including gas furnaces, heat pumps, and hydronic heating.', 'wrench'),
  ('11111111-0000-0000-0000-000000000012', 'Commercial Heating Installation', 'commercial-heating-installation', 'Installation', 'Design and installation of commercial heating systems — gas, heat pump, radiant, and hydronic solutions.', 'tool'),
  ('11111111-0000-0000-0000-000000000013', 'Commercial Refrigeration', 'commercial-refrigeration', 'Installation', 'Walk-in coolers, freezers, refrigerated display cases, and cold storage systems for restaurants and food service.', 'snowflake'),
  ('11111111-0000-0000-0000-000000000014', 'Energy Audits & Retrofits', 'energy-audits-retrofits', 'Maintenance', 'HVAC energy audits and retrofit projects to reduce utility costs and meet sustainability goals.', 'bar-chart'),
  ('11111111-0000-0000-0000-000000000015', 'VRF/VRV Systems', 'vrf-vrv-systems', 'Installation', 'Variable refrigerant flow system installation and service — ideal for multi-zone commercial spaces and mixed-use buildings.', 'layers')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SERVICE AREAS (6 total)
-- ============================================
INSERT INTO service_areas (id, name, slug, city, state, state_abbr, county, location, population, meta_title, meta_description) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Phoenix', 'phoenix-az', 'Phoenix', 'Arizona', 'AZ', 'Maricopa', ST_Point(-112.0740, 33.4484)::geography, 1608139, 'Commercial HVAC Contractors in Phoenix, AZ', 'Find top-rated commercial HVAC contractors in Phoenix, AZ. Compare reviews, request quotes, and hire the best HVAC professionals in the Phoenix metro area.'),
  ('22222222-0000-0000-0000-000000000002', 'Scottsdale', 'scottsdale-az', 'Scottsdale', 'Arizona', 'AZ', 'Maricopa', ST_Point(-111.8910, 33.4942)::geography, 258069, 'Commercial HVAC Contractors in Scottsdale, AZ', 'Find top-rated commercial HVAC contractors in Scottsdale, AZ. Compare reviews and request quotes from verified local HVAC professionals.'),
  ('22222222-0000-0000-0000-000000000003', 'Dallas', 'dallas-tx', 'Dallas', 'Texas', 'TX', 'Dallas', ST_Point(-96.7970, 32.7767)::geography, 1304379, 'Commercial HVAC Contractors in Dallas, TX', 'Find top-rated commercial HVAC contractors in Dallas, TX. Compare reviews, request quotes, and hire the best HVAC professionals in the Dallas-Fort Worth area.'),
  ('22222222-0000-0000-0000-000000000004', 'Fort Worth', 'fort-worth-tx', 'Fort Worth', 'Texas', 'TX', 'Tarrant', ST_Point(-97.3208, 32.7555)::geography, 935508, 'Commercial HVAC Contractors in Fort Worth, TX', 'Find top-rated commercial HVAC contractors in Fort Worth, TX. Compare reviews and get free quotes from local HVAC professionals.'),
  ('22222222-0000-0000-0000-000000000005', 'Miami', 'miami-fl', 'Miami', 'Florida', 'FL', 'Miami-Dade', ST_Point(-80.1918, 25.7617)::geography, 442241, 'Commercial HVAC Contractors in Miami, FL', 'Find top-rated commercial HVAC contractors in Miami, FL. Compare reviews, request quotes, and hire the best HVAC professionals in South Florida.'),
  ('22222222-0000-0000-0000-000000000006', 'Fort Lauderdale', 'fort-lauderdale-fl', 'Fort Lauderdale', 'Florida', 'FL', 'Broward', ST_Point(-80.1373, 26.1224)::geography, 182437, 'Commercial HVAC Contractors in Fort Lauderdale, FL', 'Find top-rated commercial HVAC contractors in Fort Lauderdale, FL. Compare reviews and get free quotes from local HVAC professionals.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CONTRACTOR 1: ArcticAir Commercial HVAC — Phoenix, AZ — Gold tier
-- ============================================
INSERT INTO contractors (
  id, company_name, slug, description, short_description,
  website, phone, email,
  street_address, city, state, zip_code, country,
  location, service_radius_miles,
  year_established, license_number, insurance_verified, is_verified, is_claimed, is_featured,
  operating_hours,
  subscription_tier, subscription_status,
  meta_title, meta_description,
  avg_rating, review_count, profile_views,
  -- Commercial-specific fields
  years_commercial_experience,
  commercial_verified,
  system_types,
  brands_serviced,
  tonnage_range_min,
  tonnage_range_max,
  building_types_served,
  emergency_response_minutes,
  offers_24_7,
  sla_summary,
  multi_site_coverage,
  max_sites_supported,
  offers_service_agreements,
  service_agreement_types,
  dispatch_crm,
  avg_quote_turnaround_hours,
  uses_gps_tracking,
  num_technicians,
  num_nate_certified,
  metro_area,
  slot_tier
) VALUES (
  '33333333-0000-0000-0000-000000000001',
  'ArcticAir Commercial HVAC',
  'arcticair-commercial-hvac-phoenix',
  'ArcticAir Commercial HVAC has served the Phoenix metro since 2004 with a singular focus on commercial and industrial clients. With 18 NATE-certified technicians and over two decades of commercial-only experience, we specialize in the full spectrum of commercial systems — rooftop units, VRF multi-zone installations, and large-tonnage chilled water plants. Our clients include office campuses, healthcare networks, and regional retail chains across Maricopa County. We maintain 24/7 emergency response with a guaranteed 60-minute on-site SLA for all contracted clients. Every preventive maintenance visit includes a written report with photos, parts recommendations, and energy performance notes. ServiceTitan powers our dispatch so clients have real-time visibility into every work order.',
  'Phoenix metro''s commercial HVAC specialists since 2004. 18 NATE-certified techs, 60-min emergency SLA, RTU/VRF/chilled water experts.',
  'https://www.arcticaircommercial.com',
  '(480) 555-0100',
  'service@arcticaircommercial.com',
  '4820 E McDowell Rd',
  'Phoenix', 'Arizona', '85008', 'US',
  ST_Point(-112.0219, 33.4639)::geography,
  75,
  2004, 'AZ-ROC-C39-298745', TRUE, TRUE, TRUE, TRUE,
  '{"mon": {"open": "07:00", "close": "18:00"}, "tue": {"open": "07:00", "close": "18:00"}, "wed": {"open": "07:00", "close": "18:00"}, "thu": {"open": "07:00", "close": "18:00"}, "fri": {"open": "07:00", "close": "18:00"}, "sat": {"open": "08:00", "close": "14:00"}, "sun": null, "emergency_24_7": true}',
  'gold', 'active',
  'ArcticAir Commercial HVAC | Phoenix, AZ | RTU, VRF & Chilled Water Specialists',
  'ArcticAir Commercial HVAC — Phoenix''s top-rated commercial HVAC contractor since 2004. RTU, VRF, chilled water. 60-min emergency SLA. Call (480) 555-0100.',
  4.9, 47, 3812,
  -- Commercial fields
  21,
  TRUE,
  ARRAY['rtu','vrf','chilled_water'],
  ARRAY['Carrier','Trane','Daikin','York'],
  5, 600,
  ARRAY['office','retail','healthcare'],
  60,
  TRUE,
  '60-minute on-site response for all contracted clients. Written PM reports with photos. 4-hour emergency parts sourcing. Multi-site clients get a dedicated account manager.',
  TRUE,
  20,
  TRUE,
  ARRAY['preventive_maintenance','full_service','parts_labor'],
  'ServiceTitan',
  4,
  TRUE,
  18,
  14,
  'Phoenix-Scottsdale',
  'exclusive'
);

-- ============================================
-- CONTRACTOR 2: Metro Cooling Solutions — Dallas, TX — Silver tier
-- ============================================
INSERT INTO contractors (
  id, company_name, slug, description, short_description,
  website, phone, email,
  street_address, city, state, zip_code, country,
  location, service_radius_miles,
  year_established, license_number, insurance_verified, is_verified, is_claimed, is_featured,
  operating_hours,
  subscription_tier, subscription_status,
  meta_title, meta_description,
  avg_rating, review_count, profile_views,
  -- Commercial-specific fields
  years_commercial_experience,
  commercial_verified,
  system_types,
  brands_serviced,
  tonnage_range_min,
  tonnage_range_max,
  building_types_served,
  emergency_response_minutes,
  offers_24_7,
  sla_summary,
  multi_site_coverage,
  max_sites_supported,
  offers_service_agreements,
  service_agreement_types,
  dispatch_crm,
  avg_quote_turnaround_hours,
  uses_gps_tracking,
  num_technicians,
  num_nate_certified,
  metro_area,
  slot_tier
) VALUES (
  '33333333-0000-0000-0000-000000000002',
  'Metro Cooling Solutions',
  'metro-cooling-solutions-dallas',
  'Metro Cooling Solutions has been the DFW commercial market''s trusted HVAC partner since 2010. Our 12-technician team handles everything from single-building office clients to multi-property retail and industrial portfolios across Dallas, Fort Worth, Plano, Irving, and Garland. We specialize in RTU service, split system installations, and commercial boiler work — with particular depth in industrial and warehouse environments where system uptime directly impacts operations. Our maintenance division manages over 180 preventive maintenance agreements. We operate on BuildOps for real-time dispatch and full work order history accessible to property managers at any time. Texas TACLA licensed, $5M liability, A+ BBB rated.',
  'DFW commercial HVAC specialists since 2010. RTU, split system & boiler experts. 12 certified techs, 90-min emergency response. 180+ active PM agreements.',
  'https://www.metrocoolingsolutions.com',
  '(214) 555-0247',
  'info@metrocoolingsolutions.com',
  '1901 N Stemmons Fwy',
  'Dallas', 'Texas', '75207', 'US',
  ST_Point(-96.8157, 32.7932)::geography,
  60,
  2010, 'TX-TACLA-47821C', TRUE, TRUE, TRUE, FALSE,
  '{"mon": {"open": "07:30", "close": "17:30"}, "tue": {"open": "07:30", "close": "17:30"}, "wed": {"open": "07:30", "close": "17:30"}, "thu": {"open": "07:30", "close": "17:30"}, "fri": {"open": "07:30", "close": "17:30"}, "sat": {"open": "08:00", "close": "12:00"}, "sun": null, "emergency_24_7": true}',
  'silver', 'active',
  'Metro Cooling Solutions | Dallas, TX | Commercial HVAC — RTU, Split & Boiler',
  'Metro Cooling Solutions — DFW commercial HVAC specialists. RTU, split system & boiler experts. 90-min emergency response. Call (214) 555-0247.',
  4.7, 31, 2104,
  -- Commercial fields
  15,
  TRUE,
  ARRAY['rtu','split_system','boiler'],
  ARRAY['Carrier','Trane','Lennox','Rheem/Ruud'],
  2, 200,
  ARRAY['office','industrial','retail'],
  90,
  TRUE,
  '90-minute emergency response for active maintenance clients. Same-day service calls accepted until 4pm. BuildOps portal gives clients real-time work order visibility.',
  TRUE,
  15,
  TRUE,
  ARRAY['preventive_maintenance','full_service','emergency_only'],
  'BuildOps',
  6,
  TRUE,
  12,
  9,
  'Dallas-Fort Worth',
  'preferred'
);

-- ============================================
-- CONTRACTOR 3: Coastal Climate Systems — Miami, FL — Gold tier
-- ============================================
INSERT INTO contractors (
  id, company_name, slug, description, short_description,
  website, phone, email,
  street_address, city, state, zip_code, country,
  location, service_radius_miles,
  year_established, license_number, insurance_verified, is_verified, is_claimed, is_featured,
  operating_hours,
  subscription_tier, subscription_status,
  meta_title, meta_description,
  avg_rating, review_count, profile_views,
  -- Commercial-specific fields
  years_commercial_experience,
  commercial_verified,
  system_types,
  brands_serviced,
  tonnage_range_min,
  tonnage_range_max,
  building_types_served,
  emergency_response_minutes,
  offers_24_7,
  sla_summary,
  multi_site_coverage,
  max_sites_supported,
  offers_service_agreements,
  service_agreement_types,
  dispatch_crm,
  avg_quote_turnaround_hours,
  uses_gps_tracking,
  num_technicians,
  num_nate_certified,
  metro_area,
  slot_tier
) VALUES (
  '33333333-0000-0000-0000-000000000003',
  'Coastal Climate Systems',
  'coastal-climate-systems-miami',
  'Coastal Climate Systems has operated in the South Florida commercial market since 2002, building a reputation for handling the most demanding HVAC environments in the region. Our 24-technician team holds deep expertise in VRF multi-zone installations, large-tonnage chilled water plants, and cooling tower systems — the infrastructure that keeps Miami''s hotels, hospitals, and data centers running in extreme heat and humidity. We are Florida State Certified (CAC and CFC licensed) and carry $10M in general liability. Emergency response is guaranteed at 45 minutes for contracted clients. FieldEdge powers our dispatch and client portal, giving property managers instant access to PM schedules, equipment history, and real-time technician location. We serve Miami-Dade, Broward, and Palm Beach counties.',
  'Miami''s premier commercial HVAC contractor since 2002. 24 techs, VRF/chilled water/cooling tower experts. 45-min SLA. Hospitality, healthcare & data center specialists.',
  'https://www.coastalclimatesystems.com',
  '(305) 555-0312',
  'contact@coastalclimatesystems.com',
  '8450 NW 36th St',
  'Miami', 'Florida', '33166', 'US',
  ST_Point(-80.2952, 25.8051)::geography,
  60,
  2002, 'FL-CAC-1821055', TRUE, TRUE, TRUE, TRUE,
  '{"mon": {"open": "07:00", "close": "18:00"}, "tue": {"open": "07:00", "close": "18:00"}, "wed": {"open": "07:00", "close": "18:00"}, "thu": {"open": "07:00", "close": "18:00"}, "fri": {"open": "07:00", "close": "18:00"}, "sat": {"open": "08:00", "close": "15:00"}, "sun": null, "emergency_24_7": true}',
  'gold', 'active',
  'Coastal Climate Systems | Miami, FL | VRF, Chilled Water & Cooling Tower Specialists',
  'Coastal Climate Systems — Miami''s top commercial HVAC contractor. VRF, chilled water & cooling towers. 45-min emergency SLA. Call (305) 555-0312.',
  4.8, 38, 2971,
  -- Commercial fields
  23,
  TRUE,
  ARRAY['vrf','chilled_water','cooling_tower'],
  ARRAY['Daikin','Carrier','Johnson Controls','McQuay','Mitsubishi'],
  10, 1200,
  ARRAY['hospitality','healthcare','data_center'],
  45,
  TRUE,
  '45-minute guaranteed on-site response for contracted clients. 24/7 monitoring of critical systems via FieldEdge. Dedicated project manager for all installs over $50K. Quarterly SLA review meetings for enterprise accounts.',
  TRUE,
  30,
  TRUE,
  ARRAY['preventive_maintenance','full_service','parts_labor','emergency_only'],
  'FieldEdge',
  4,
  TRUE,
  24,
  18,
  'Miami-Fort Lauderdale',
  'exclusive'
);

-- ============================================
-- CONTRACTOR SERVICES (Junction)
-- ============================================

-- ArcticAir (Phoenix) — RTU, VRF, chilled water focus
INSERT INTO contractor_services (contractor_id, service_id) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'), -- AC Repair
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'), -- AC Installation
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'), -- RTU Service
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004'), -- Emergency
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005'), -- Preventive Maintenance
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000006'), -- Chiller
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000009'), -- BAS
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000014'), -- Energy Audits
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000015'); -- VRF/VRV

-- Metro Cooling (Dallas) — RTU, split, boiler focus
INSERT INTO contractor_services (contractor_id, service_id) VALUES
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'), -- AC Repair
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002'), -- AC Installation
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'), -- RTU Service
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004'), -- Emergency
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000005'), -- Preventive Maintenance
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000007'), -- Boiler
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000011'), -- Heating Repair
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000012'); -- Heating Install

-- Coastal Climate (Miami) — VRF, chilled water, cooling tower focus
INSERT INTO contractor_services (contractor_id, service_id) VALUES
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'), -- AC Repair
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002'), -- AC Installation
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004'), -- Emergency
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005'), -- Preventive Maintenance
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006'), -- Chiller
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000010'), -- IAQ
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000014'), -- Energy Audits
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000015'); -- VRF/VRV

-- ============================================
-- CONTRACTOR SERVICE AREAS (Junction)
-- ============================================

-- ArcticAir serves Phoenix + Scottsdale
INSERT INTO contractor_service_areas (contractor_id, service_area_id) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'), -- Phoenix
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002'); -- Scottsdale

-- Metro Cooling serves Dallas + Fort Worth
INSERT INTO contractor_service_areas (contractor_id, service_area_id) VALUES
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003'), -- Dallas
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004'); -- Fort Worth

-- Coastal Climate serves Miami + Fort Lauderdale
INSERT INTO contractor_service_areas (contractor_id, service_area_id) VALUES
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000005'), -- Miami
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000006'); -- Fort Lauderdale

-- ============================================
-- REVIEWS (9 total — 3 per contractor)
-- Includes reviewer_title, building_type, project_type
-- ============================================

-- Reviews for ArcticAir (Phoenix) — avg 4.9
INSERT INTO reviews (
  id, contractor_id, reviewer_name, reviewer_company, reviewer_title,
  rating, title, body,
  is_verified, response, response_date, status, created_at,
  building_type, project_type
) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    'Marcus Webb', 'Pinnacle Property Group', 'Director of Facilities',
    5,
    '$340K chiller replacement — on time, no tenant complaints',
    'ArcticAir replaced both chillers in our 18-story Class A office tower last spring. This was a $340K project with zero tolerance for downtime — tenants on floors 4-18 are law firms and financial services companies. The project came in on schedule, the transition to the new plant was seamless, and we did not receive a single complaint from a tenant during the six-week installation. The PM reports they provide are detailed and immediately useful for our capital planning. I would hire them again without hesitation.',
    TRUE,
    'Thank you, Marcus. Projects of that scale require meticulous planning and a great client partner — you and your team made it easy. We look forward to the annual PM work ahead.',
    '2025-08-15T09:00:00Z',
    'approved', '2025-08-14T11:32:00Z',
    'office', 'replacement'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    'Sandra Ortega', 'Sonoran Health Network', 'Facility Manager',
    5,
    'Critical environment specialists — they understand healthcare HVAC',
    'Running HVAC for a surgical center is not the same as running it for an office building. Precision temperature and humidity control is life-safety critical in our procedure rooms, and downtime is not an option. ArcticAir has maintained our system for four years with zero unplanned outages. Every PM visit is documented with photos, trending data, and a parts-forward recommendation. When a compressor failed at 3am on a Tuesday, they had a technician on-site in under 40 minutes and the backup system engaged before any room was affected.',
    TRUE,
    'Sandra, thank you. Healthcare facilities are where we hold ourselves to the highest standard. Your team''s trust means everything to us.',
    '2025-09-02T10:15:00Z',
    'approved', '2025-09-01T16:45:00Z',
    'healthcare', 'maintenance_contract'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000001',
    'Troy Dawkins', 'Dawkins Retail Properties', 'Property Manager',
    4,
    'Strong work on 8-location RTU replacement program',
    'Contracted ArcticAir to replace aging RTUs across 8 of our strip mall locations over two seasons. Competitive pricing, professional crews, and they finished the first four locations ahead of schedule. Minor issue with thermostat specification on one unit but they corrected it same day without any pushback. We have already engaged them for next season''s remaining four locations. Very solid commercial partner for retail property owners.',
    TRUE, NULL, NULL,
    'approved', '2025-10-20T14:00:00Z',
    'retail', 'replacement'
  );

-- Reviews for Metro Cooling Solutions (Dallas) — avg 4.7
INSERT INTO reviews (
  id, contractor_id, reviewer_name, reviewer_company, reviewer_title,
  rating, title, body,
  is_verified, response, response_date, status, created_at,
  building_type, project_type
) VALUES
  (
    '44444444-0000-0000-0000-000000000004',
    '33333333-0000-0000-0000-000000000002',
    'Patricia Holloway', 'Holloway Industrial Partners', 'Director of Operations',
    5,
    'Outstanding boiler work on our 200,000 sq ft distribution center',
    'Metro Cooling handled a full boiler replacement and repiping project at our distribution center in Irving. The scope was complex — we could not shut down operations during the work, which required phased cutover during off-peak hours. Their project management was excellent. They communicated daily, hit every milestone, and the crew worked nights and weekends without complaint. The new system has reduced our heating costs by 22% this winter. We now have them on a full-service maintenance agreement across three of our DFW properties.',
    TRUE,
    'Patricia, thank you — industrial projects with live operations are our bread and butter. We appreciate the trust you placed in us.',
    '2025-07-19T11:30:00Z',
    'approved', '2025-07-18T18:22:00Z',
    'industrial', 'replacement'
  ),
  (
    '44444444-0000-0000-0000-000000000005',
    '33333333-0000-0000-0000-000000000002',
    'Derek Simmons', 'Simmons Office Portfolio', 'VP of Asset Management',
    5,
    'Best HVAC partner we have worked with across a 14-property portfolio',
    'We manage 14 commercial office properties across DFW and Metro Cooling handles all of our HVAC maintenance. The BuildOps portal they use is outstanding — I can pull the service history for any building in under 30 seconds, and their techs always update the work order before they leave the site. In two years, they have helped us avoid two major system failures through predictive maintenance and saved us an estimated $60K in emergency repair costs. Their pricing is fair and transparent. Highly recommend for any multi-property operator.',
    TRUE, NULL, NULL,
    'approved', '2025-11-03T09:00:00Z',
    'office', 'maintenance_contract'
  ),
  (
    '44444444-0000-0000-0000-000000000006',
    '33333333-0000-0000-0000-000000000002',
    'Angela Torres', 'North Texas Medical Offices', 'Facility Director',
    4,
    'Reliable team, minor scheduling friction on non-emergency calls',
    'Overall very positive experience. Metro Cooling maintains our RTUs and split systems across four medical office buildings in the Plano area. Their technicians are knowledgeable, thorough, and respectful of our clinical environment. The only reason for four stars instead of five is that non-emergency scheduling can run 2-3 days out during peak season. When we have flagged this, they have been responsive. Their emergency response, however, is fast — they have met their 90-minute SLA every time we have had a critical call.',
    TRUE,
    'Angela, your feedback on scheduling is noted and we are actively expanding the team. Thank you for the continued partnership.',
    '2025-06-12T14:00:00Z',
    'approved', '2025-06-10T10:30:00Z',
    'healthcare', 'maintenance_contract'
  );

-- Reviews for Coastal Climate Systems (Miami) — avg 4.8
INSERT INTO reviews (
  id, contractor_id, reviewer_name, reviewer_company, reviewer_title,
  rating, title, body,
  is_verified, response, response_date, status, created_at,
  building_type, project_type
) VALUES
  (
    '44444444-0000-0000-0000-000000000007',
    '33333333-0000-0000-0000-000000000003',
    'Roberto Fuentes', 'Brickell Financial Properties', 'Director of Engineering',
    5,
    '$2.1M chiller plant retrofit — 31% energy reduction, zero tenant disruption',
    'Coastal Climate performed a complete chiller plant retrofit on our 26-floor Class A office tower in Brickell. The scope included two new 500-ton magnetic bearing chillers, primary-secondary pumping overhaul, and BAS integration. Project value was $2.1M. They delivered on time, within budget, and managed the live cutover across six weekends with no tenant hot calls and no unscheduled downtime. Post-commissioning, we have measured a 31% reduction in chiller plant energy consumption. This is the best capital project outcome I have seen in 15 years as a building engineer.',
    TRUE, NULL, NULL,
    'approved', '2025-08-27T16:00:00Z',
    'office', 'retrofit'
  ),
  (
    '44444444-0000-0000-0000-000000000008',
    '33333333-0000-0000-0000-000000000003',
    'Jennifer Kwan', 'Coral Gables Hospitality Group', 'Director of Operations',
    5,
    'Excellent hotel HVAC partner — they understand guest-first constraints',
    'We use Coastal Climate for all HVAC maintenance across our three boutique hotels in Coral Gables and Coconut Grove. Hotel HVAC is uniquely demanding — access windows are tight, noise is critical, and guest comfort is non-negotiable. Their team understands this and plans every PM visit around our occupancy calendar. They proactively flagged a failing cooling tower during a routine PM, preventing what would have been a catastrophic failure during peak season. Two years in, they are our most reliable vendor.',
    TRUE,
    'Jennifer, thank you — hotel environments demand a different level of planning and care, and we take that seriously. Appreciate your continued trust.',
    '2025-09-18T11:00:00Z',
    'approved', '2025-09-16T15:45:00Z',
    'hospitality', 'maintenance_contract'
  ),
  (
    '44444444-0000-0000-0000-000000000009',
    '33333333-0000-0000-0000-000000000003',
    'Carlos Mendez', 'Doral Data Centers', 'Facility Manager',
    5,
    'Mission-critical HVAC — they take it as seriously as we do',
    'Coastal Climate maintains the precision cooling infrastructure across our two data center facilities in Doral. They understand that a temperature deviation in a data center is not a comfort issue — it is a business continuity event. Their 45-minute SLA has held without exception in 18 months. Every tech who enters our space holds a security clearance and follows our access protocols without complaint. The FieldEdge portal they use is excellent — I can see equipment runtime hours, fault history, and scheduled PM dates without making a phone call.',
    TRUE, NULL, NULL,
    'approved', '2025-10-05T12:00:00Z',
    'data_center', 'maintenance_contract'
  );

-- ============================================
-- SAMPLE PROJECTS (6 total — 2 per contractor)
-- ============================================

-- ArcticAir (Phoenix) — Project 1
INSERT INTO sample_projects (
  id, contractor_id, project_name, building_type, description,
  square_footage, tonnage, system_type, project_type,
  completion_date, project_value_range, energy_savings_pct,
  city, state, image_urls, sort_order, created_at
) VALUES (
  '55555555-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000001',
  '18-Story Class A Office Tower — Chiller Plant Replacement',
  'office',
  'Complete replacement of two aging centrifugal chillers (500 tons each) in a downtown Phoenix high-rise. Project included new primary-secondary chilled water piping, variable frequency drives on all pumps, and full integration with the building BAS. Work was phased across six weekends to avoid tenant disruption. Post-commissioning energy audit confirmed a 28% reduction in cooling plant kWh compared to the prior system.',
  320000,
  1000,
  'chilled_water',
  'replacement',
  '2025-05-30',
  '$280,000 – $340,000',
  28,
  'Phoenix', 'AZ',
  ARRAY[]::text[],
  1,
  NOW()
),
-- ArcticAir (Phoenix) — Project 2
(
  '55555555-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000001',
  '12-Location Retail Strip Mall — Multi-Site RTU Replacement Program',
  'retail',
  'Two-season replacement program covering 48 aging rooftop units across a regional retail client''s 12 Phoenix metro strip mall locations. Each location averaged 4 RTUs ranging from 7.5 to 25 tons. ArcticAir managed procurement, permitting, and installation across all 12 sites with a dedicated project coordinator. Year 1 covered 24 units; Year 2 covered the remaining 24. All units replaced with Carrier high-efficiency RTUs programmed to a centralized BAS dashboard.',
  NULL,
  360,
  'rtu',
  'replacement',
  '2025-10-15',
  '$420,000 – $490,000',
  NULL,
  'Phoenix', 'AZ',
  ARRAY[]::text[],
  2,
  NOW()
);

-- Metro Cooling Solutions (Dallas) — Project 1
INSERT INTO sample_projects (
  id, contractor_id, project_name, building_type, description,
  square_footage, tonnage, system_type, project_type,
  completion_date, project_value_range, energy_savings_pct,
  city, state, image_urls, sort_order, created_at
) VALUES (
  '55555555-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000002',
  '200,000 Sq Ft Distribution Center — Boiler Replacement & Repiping',
  'industrial',
  'Full replacement of two 500 MBH commercial boilers and complete repiping of the hydronic heating loop at a live distribution center in Irving, TX. Work was performed in phases during overnight and weekend windows to avoid disruption to warehouse operations. New boilers include outdoor reset controls and variable-speed pumping, resulting in a 22% reduction in heating season gas consumption.',
  200000,
  NULL,
  'boiler',
  'replacement',
  '2025-04-20',
  '$160,000 – $210,000',
  22,
  'Irving', 'TX',
  ARRAY[]::text[],
  1,
  NOW()
),
-- Metro Cooling Solutions (Dallas) — Project 2
(
  '55555555-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000002',
  '14-Property Office Portfolio — Annual Preventive Maintenance Contract',
  'office',
  'Full-service preventive maintenance agreement covering 14 commercial office properties across Dallas, Plano, and Garland for a single ownership group. Scope includes bi-annual PM visits per building, filter changes, coil cleaning, belt inspections, refrigerant checks, and written condition reports with capital planning recommendations. All work orders managed in BuildOps with client portal access. Contract value is approximately $210K annually.',
  NULL,
  NULL,
  'rtu',
  'maintenance_contract',
  '2025-01-01',
  '$180,000 – $220,000',
  NULL,
  'Dallas', 'TX',
  ARRAY[]::text[],
  2,
  NOW()
);

-- Coastal Climate Systems (Miami) — Project 1
INSERT INTO sample_projects (
  id, contractor_id, project_name, building_type, description,
  square_footage, tonnage, system_type, project_type,
  completion_date, project_value_range, energy_savings_pct,
  city, state, image_urls, sort_order, created_at
) VALUES (
  '55555555-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000003',
  'Brickell 26-Floor Office Tower — Magnetic Bearing Chiller Plant Retrofit',
  'office',
  'Complete chiller plant retrofit for a 26-story Class A office tower in Miami''s Brickell financial district. Project replaced two aging 500-ton centrifugal chillers with magnetic bearing variable-speed chillers, overhaul of primary-secondary chilled water pumping, and full BAS integration with Niagara Framework. Commissioning included ASHRAE Level II energy audit. Post-installation energy monitoring confirmed a 31% reduction in chiller plant kWh consumption at full-load conditions.',
  480000,
  1000,
  'chilled_water',
  'retrofit',
  '2025-07-31',
  '$1,900,000 – $2,200,000',
  31,
  'Miami', 'FL',
  ARRAY[]::text[],
  1,
  NOW()
),
-- Coastal Climate Systems (Miami) — Project 2
(
  '55555555-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000003',
  'Wynwood Mixed-Use Development — 800-Ton VRF Design-Build',
  'mixed_use',
  'Design-build VRF installation for a new 220,000 sq ft mixed-use development in the Wynwood Arts District, comprising retail ground floor, 6 floors of creative office, and rooftop hospitality. Coastal Climate designed and installed 14 Daikin VRF systems with 800 tons combined cooling capacity, BACnet-integrated zone controls, and a centralized energy dashboard accessible to the property manager. Project required coordination with the general contractor during a live construction schedule.',
  220000,
  800,
  'vrf',
  'new_installation',
  '2025-11-30',
  '$3,200,000 – $3,800,000',
  NULL,
  'Miami', 'FL',
  ARRAY[]::text[],
  2,
  NOW()
);

-- ============================================
-- SUBSCRIPTION PLANS (config data)
-- ============================================
INSERT INTO subscription_plans (name, slug, price_monthly, price_annual, features, max_photos, max_service_areas, featured_placement, sort_order) VALUES
  (
    'Free', 'free', 0, 0,
    '["Basic directory listing", "Up to 3 photos", "1 service area", "Email lead notifications", "Up to 5 leads/month"]',
    3, 1, FALSE, 0
  ),
  (
    'Bronze', 'bronze', 4900, 46800,
    '["Enhanced listing with project portfolio", "Up to 10 photos & 3 sample projects", "3 service areas", "Email + SMS notifications", "Respond to reviews", "Basic analytics", "Up to 20 leads/month"]',
    10, 3, FALSE, 1
  ),
  (
    'Silver', 'silver', 14900, 142800,
    '["Priority listing in search results", "Up to 25 photos & 10 sample projects", "10 service areas", "Real-time notifications", "Full analytics dashboard", "Commercial Verified badge", "Booking calendar", "Up to 50 leads/month", "Preferred market slot"]',
    25, 10, FALSE, 2
  ),
  (
    'Gold', 'gold', 34900, 334800,
    '["Featured placement + market slot priority", "Unlimited photos & sample projects", "Unlimited service areas", "Real-time + CRM webhook integration", "Advanced analytics + company IP lookup", "Commercial Verified badge", "Quote auto-response", "Dedicated account manager", "Unlimited leads/month", "Priority/exclusive market slot"]',
    9999, 9999, TRUE, 3
  )
ON CONFLICT (slug) DO NOTHING;
