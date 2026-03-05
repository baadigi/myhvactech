import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return null
  }
  return user
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Curated Commercial HVAC Topics ──────────────────────────────────────────

interface TopicTemplate {
  title: string
  category: string
  tags: string[]
  sections: {
    heading: string
    content: string
  }[]
}

const TOPICS_POOL: TopicTemplate[] = [
  {
    title: 'Energy Efficiency Regulations Every Commercial Building Owner Should Know in 2026',
    category: 'regulations',
    tags: ['energy-efficiency', 'regulations', 'commercial-hvac', 'compliance'],
    sections: [
      {
        heading: 'The Regulatory Landscape Is Shifting',
        content: 'Federal and state energy efficiency mandates are tightening. Building owners and facility managers need to understand the latest requirements to avoid penalties and capitalize on incentive programs. The Department of Energy has updated minimum efficiency standards for commercial HVAC equipment, impacting new installations and major retrofits.',
      },
      {
        heading: 'Key Federal Standards Updates',
        content: '<ul><li><strong>ASHRAE 90.1-2022:</strong> The latest version raises the bar for minimum HVAC efficiency in commercial buildings, with stricter requirements for economizer controls and heat recovery.</li><li><strong>DOE Equipment Standards:</strong> New minimum efficiency requirements for rooftop units (RTUs) above 65,000 BTU/h now mandate higher IEER ratings.</li><li><strong>EPA Refrigerant Phase-down:</strong> The AIM Act continues the HFC phase-down schedule, affecting equipment choices and service costs.</li></ul>',
      },
      {
        heading: 'State and Local Requirements',
        content: 'Many states have adopted or are considering Building Performance Standards (BPS) that require existing buildings to meet energy benchmarks. Cities like New York (Local Law 97), Denver, and Washington DC have already implemented carbon emission caps for large commercial buildings. Failure to comply can result in significant annual fines.',
      },
      {
        heading: 'How to Prepare Your Building',
        content: '<ul><li>Schedule an energy audit to benchmark current HVAC performance</li><li>Review equipment age and efficiency ratings against new minimums</li><li>Evaluate opportunities for controls upgrades and building automation</li><li>Explore utility rebate programs for high-efficiency replacements</li><li>Develop a 3-5 year capital plan for phased equipment upgrades</li></ul>',
      },
      {
        heading: 'The Bottom Line',
        content: 'Proactive compliance with energy efficiency regulations can reduce operating costs by 15-30% while future-proofing your building against stricter requirements. Work with a qualified commercial HVAC contractor to develop a compliance roadmap tailored to your specific building portfolio.',
      },
    ],
  },
  {
    title: 'Preventive Maintenance Best Practices for Commercial HVAC Systems',
    category: 'tips',
    tags: ['preventive-maintenance', 'commercial-hvac', 'best-practices', 'cost-savings'],
    sections: [
      {
        heading: 'Why Preventive Maintenance Matters',
        content: 'Commercial HVAC systems represent 40-60% of a building\'s energy consumption. Without regular maintenance, efficiency degrades 5-10% annually, leading to higher utility bills, more frequent breakdowns, and shortened equipment life. A structured PM program typically delivers 15-20% energy savings and reduces emergency repair costs by up to 70%.',
      },
      {
        heading: 'Essential Monthly Tasks',
        content: '<ul><li>Inspect and replace air filters (or clean if washable)</li><li>Check thermostat and BAS setpoints for accuracy</li><li>Verify condensate drain lines are clear</li><li>Monitor refrigerant pressures and temperatures</li><li>Inspect belt tension and condition on belt-driven equipment</li></ul>',
      },
      {
        heading: 'Quarterly Maintenance Checklist',
        content: '<ul><li>Clean evaporator and condenser coils</li><li>Test safety controls and limit switches</li><li>Lubricate bearings and moving parts</li><li>Check electrical connections and tighten terminals</li><li>Calibrate sensors and controls</li><li>Inspect ductwork for leaks and insulation damage</li></ul>',
      },
      {
        heading: 'Annual and Seasonal Tasks',
        content: '<ul><li><strong>Pre-cooling season:</strong> Full system checkout, refrigerant charge verification, economizer testing</li><li><strong>Pre-heating season:</strong> Heat exchanger inspection, combustion analysis, gas valve testing</li><li><strong>Annual:</strong> Vibration analysis, oil sampling (for large chillers), comprehensive controls review</li></ul>',
      },
      {
        heading: 'Building a PM Program',
        content: 'Start with a complete equipment inventory, establish baseline performance metrics, and schedule maintenance during off-peak hours. Consider a service agreement with a qualified commercial HVAC contractor who can provide regular inspections, priority emergency response, and discounted parts and labor.',
      },
    ],
  },
  {
    title: 'VRF vs. RTU: Choosing the Right Commercial HVAC System for Your Building',
    category: 'industry-news',
    tags: ['vrf', 'rtu', 'system-comparison', 'commercial-hvac', 'building-design'],
    sections: [
      {
        heading: 'Understanding Your Options',
        content: 'Variable Refrigerant Flow (VRF) and Rooftop Units (RTU) are two of the most common commercial HVAC approaches. Each has distinct advantages depending on building type, size, climate, and operational requirements. Making the right choice can impact comfort, energy costs, and maintenance expenses for decades.',
      },
      {
        heading: 'RTU Systems: The Traditional Workhorse',
        content: '<ul><li><strong>Best for:</strong> Single-story retail, warehouses, restaurants, small-to-mid-size offices</li><li><strong>Pros:</strong> Lower upfront cost, simpler installation, easy rooftop access for maintenance, familiar to most technicians</li><li><strong>Cons:</strong> Less precise zone control, ductwork losses, higher energy use in partial-load conditions</li><li><strong>Efficiency:</strong> Modern RTUs with variable speed drives and economizers achieve IEER ratings of 14-20+</li></ul>',
      },
      {
        heading: 'VRF Systems: Precision and Efficiency',
        content: '<ul><li><strong>Best for:</strong> Multi-story offices, hotels, mixed-use buildings, retrofit projects with limited space</li><li><strong>Pros:</strong> Excellent zone control, simultaneous heating and cooling, no ductwork needed, quiet operation, heat recovery capability</li><li><strong>Cons:</strong> Higher upfront cost, requires specialized technicians, refrigerant piping complexity, potential for larger refrigerant charges</li><li><strong>Efficiency:</strong> VRF systems can achieve energy savings of 20-40% compared to conventional systems</li></ul>',
      },
      {
        heading: 'Cost Comparison',
        content: 'RTU installations typically cost $5-12 per square foot, while VRF systems range from $15-25 per square foot. However, VRF often requires less structural support (no heavy rooftop equipment) and no ductwork, which can offset the equipment premium. Lifecycle cost analysis over 15-20 years often favors VRF in multi-zone applications.',
      },
      {
        heading: 'Making the Decision',
        content: 'Consider these factors: building type and number of zones, available space for equipment and distribution, local climate, energy costs, maintenance capabilities, and long-term ownership plans. A qualified commercial HVAC contractor can perform a detailed load calculation and lifecycle cost analysis to guide your decision.',
      },
    ],
  },
  {
    title: 'Chiller Maintenance: Protecting Your Largest HVAC Investment',
    category: 'tips',
    tags: ['chiller', 'maintenance', 'commercial-hvac', 'equipment-care'],
    sections: [
      {
        heading: 'The Cost of Neglect',
        content: 'Chillers are often the single most expensive piece of HVAC equipment in a commercial building, with replacement costs ranging from $150,000 to over $1 million. Yet many building owners defer maintenance until catastrophic failure. A well-maintained chiller can operate efficiently for 25-30 years, while a neglected one may fail in 15 or fewer.',
      },
      {
        heading: 'Daily and Weekly Monitoring',
        content: '<ul><li>Log approach temperatures (evaporator and condenser)</li><li>Monitor oil pressure differential and oil level</li><li>Check refrigerant levels and look for signs of leaks</li><li>Record amp draws and compare to baseline</li><li>Verify condenser water flow rates and temperatures</li></ul>',
      },
      {
        heading: 'Annual Maintenance Requirements',
        content: '<ul><li>Eddy current testing of heat exchanger tubes</li><li>Oil analysis and filter replacement</li><li>Refrigerant analysis (moisture, acid, and contaminants)</li><li>Vibration analysis of compressor and motor bearings</li><li>Controls calibration and software updates</li><li>Electrical testing of starter, VFD, and safety circuits</li></ul>',
      },
      {
        heading: 'Efficiency Optimization',
        content: 'Proper chiller maintenance can maintain efficiency within 2-3% of design ratings. Key optimization strategies include keeping tubes clean, maintaining proper refrigerant charge, optimizing condenser water temperature, and implementing chiller plant sequencing strategies for multi-chiller installations.',
      },
      {
        heading: 'When to Plan for Replacement',
        content: 'Start planning for replacement when your chiller is 20+ years old, requires R-22 or other phased-out refrigerants, shows declining efficiency despite maintenance, or when repair costs exceed 50% of replacement value. Modern chillers offer 30-50% better efficiency than units from 20 years ago.',
      },
    ],
  },
  {
    title: 'Building Automation Trends Transforming Commercial HVAC in 2026',
    category: 'industry-news',
    tags: ['building-automation', 'smart-buildings', 'iot', 'commercial-hvac', 'technology'],
    sections: [
      {
        heading: 'The Smart Building Revolution',
        content: 'Building automation systems (BAS) have evolved from simple programmable thermostats to sophisticated platforms that integrate HVAC, lighting, security, and occupancy data. The global smart building market is projected to reach $150 billion by 2028, driven by energy mandates, tenant expectations, and advances in IoT technology.',
      },
      {
        heading: 'AI-Powered Predictive Maintenance',
        content: 'Machine learning algorithms now analyze equipment sensor data to predict failures before they occur. Modern BAS platforms can detect anomalies in compressor performance, fan motor vibration, and refrigerant pressures, alerting facility teams days or weeks before a breakdown. This reduces unplanned downtime by up to 50% and extends equipment life.',
      },
      {
        heading: 'Demand-Controlled Ventilation',
        content: 'CO2 and occupancy sensors are enabling truly demand-driven ventilation strategies. Instead of conditioning air for maximum occupancy at all times, smart systems adjust fresh air delivery based on real-time occupancy data. This can reduce HVAC energy consumption by 20-30% while improving indoor air quality.',
      },
      {
        heading: 'Cloud-Based Management Platforms',
        content: '<ul><li>Remote monitoring and control from any device</li><li>Portfolio-wide energy benchmarking and analytics</li><li>Automated fault detection and diagnostics (AFDD)</li><li>Integration with utility demand response programs</li><li>Tenant comfort apps with personalized zone control</li></ul>',
      },
      {
        heading: 'Getting Started with Building Automation',
        content: 'Begin with an audit of existing controls and infrastructure. Many legacy systems can be upgraded with IoT overlays without full replacement. Prioritize high-ROI applications like scheduling optimization, demand-controlled ventilation, and fault detection. Work with a contractor experienced in both HVAC and building automation integration.',
      },
    ],
  },
  {
    title: 'Indoor Air Quality Standards: What Commercial Building Managers Need to Know',
    category: 'regulations',
    tags: ['iaq', 'indoor-air-quality', 'ventilation', 'ashrae', 'commercial-buildings'],
    sections: [
      {
        heading: 'IAQ Has Never Been More Important',
        content: 'Post-pandemic awareness has permanently elevated expectations for indoor air quality in commercial buildings. Tenants, employees, and customers now expect clean, well-ventilated spaces. Poor IAQ is linked to a 10-15% decrease in worker productivity and can contribute to increased absenteeism and tenant turnover.',
      },
      {
        heading: 'Key Standards and Guidelines',
        content: '<ul><li><strong>ASHRAE 62.1:</strong> The primary ventilation standard for commercial buildings, specifying minimum outdoor air requirements per person and per square foot by space type</li><li><strong>ASHRAE 241:</strong> The newer standard specifically addressing infection risk management through ventilation, filtration, and air cleaning</li><li><strong>WELL Building Standard:</strong> Voluntary certification that includes comprehensive air quality requirements, increasingly demanded by Class A tenants</li></ul>',
      },
      {
        heading: 'Monitoring and Measurement',
        content: '<ul><li>CO2 levels (proxy for ventilation adequacy) — target below 800 ppm</li><li>Particulate matter (PM2.5 and PM10) — critical for occupant health</li><li>Temperature and humidity — maintain 68-76°F and 30-60% RH</li><li>VOCs (volatile organic compounds) — from building materials, cleaning products, furnishings</li><li>Airborne pathogen risk — emerging metric using equivalent clean air delivery rate</li></ul>',
      },
      {
        heading: 'Improvement Strategies',
        content: '<ul><li>Increase outdoor air ventilation rates where economically feasible</li><li>Upgrade filtration to MERV-13 or higher</li><li>Add in-duct UV-C germicidal irradiation for pathogen control</li><li>Install bipolar ionization or other air cleaning technologies</li><li>Commission and verify economizer operation</li><li>Implement demand-controlled ventilation with CO2 sensors</li></ul>',
      },
      {
        heading: 'The Business Case for Better IAQ',
        content: 'Studies show that improved IAQ can increase worker productivity by 8-11% and reduce sick days by 35%. For a typical office building, the financial benefit of improved productivity far outweighs the incremental HVAC operating cost. Many upgrades also qualify for utility rebates and can be leveraged in tenant marketing materials.',
      },
    ],
  },
  {
    title: 'HVAC Considerations for Healthcare Facilities: Compliance and Best Practices',
    category: 'industry-news',
    tags: ['healthcare', 'hospital-hvac', 'compliance', 'specialized-hvac'],
    sections: [
      {
        heading: 'Healthcare HVAC Is Different',
        content: 'Healthcare facilities have the most demanding HVAC requirements of any building type. From operating rooms requiring 20+ air changes per hour to pharmacy cleanrooms needing ISO-classified environments, the stakes are literally life and death. Non-compliance with ventilation standards can result in facility citations, insurance issues, and patient harm.',
      },
      {
        heading: 'Critical Design Requirements',
        content: '<ul><li><strong>Pressure relationships:</strong> Operating rooms, isolation rooms, and pharmacies require precise positive or negative pressure differentials</li><li><strong>Air changes:</strong> OR suites require minimum 20 ACH with 4 ACH outdoor air</li><li><strong>Filtration:</strong> HEPA filtration for protective environments, minimum MERV-14 for general patient areas</li><li><strong>Humidity control:</strong> Critical for infection control and equipment protection (typically 30-60% RH)</li><li><strong>Redundancy:</strong> Critical care areas require N+1 cooling redundancy with automatic failover</li></ul>',
      },
      {
        heading: 'Regulatory Framework',
        content: 'Healthcare HVAC must comply with ASHRAE 170 (Ventilation of Health Care Facilities), FGI Guidelines, and Joint Commission requirements. State health departments may impose additional requirements. All HVAC maintenance must be documented for regulatory inspections.',
      },
      {
        heading: 'Maintenance Priorities',
        content: '<ul><li>Monthly pressure differential verification and documentation</li><li>Quarterly filter inspections with documented replacement schedules</li><li>Semi-annual testing of emergency power for HVAC systems</li><li>Annual air balancing verification for critical areas</li><li>Continuous monitoring via BAS with alarming for out-of-range conditions</li></ul>',
      },
      {
        heading: 'Choosing the Right Contractor',
        content: 'Healthcare HVAC requires specialized expertise. Look for contractors with specific healthcare experience, understanding of ASHRAE 170 and FGI guidelines, ability to work in occupied healthcare environments, and familiarity with infection control risk assessment (ICRA) protocols for construction and renovation projects.',
      },
    ],
  },
  {
    title: 'Emergency Preparedness for Commercial HVAC: Protecting Your Business',
    category: 'tips',
    tags: ['emergency-preparedness', 'disaster-recovery', 'commercial-hvac', 'business-continuity'],
    sections: [
      {
        heading: 'When HVAC Failure Becomes a Business Crisis',
        content: 'A commercial HVAC failure during extreme weather can force building closures, damage inventory, compromise data centers, and disrupt operations. For many businesses, even a few hours without climate control can result in tens of thousands of dollars in losses. Emergency preparedness is not optional — it is a business continuity requirement.',
      },
      {
        heading: 'Developing an HVAC Emergency Plan',
        content: '<ul><li>Identify critical systems and spaces that cannot tolerate HVAC downtime</li><li>Document all equipment locations, model numbers, and service contacts</li><li>Establish priority restoration sequence (e.g., server room > pharmacy > general office)</li><li>Maintain emergency contact list for your HVAC contractor with 24/7 availability confirmation</li><li>Review and update the plan annually</li></ul>',
      },
      {
        heading: 'Equipment Redundancy Strategies',
        content: '<ul><li>N+1 redundancy for critical cooling (data centers, telecom, healthcare)</li><li>Portable cooling units pre-positioned or available through rental agreement</li><li>Emergency generator sizing that includes HVAC loads</li><li>Automatic transfer switches for critical HVAC equipment</li><li>Thermal energy storage to bridge short outages</li></ul>',
      },
      {
        heading: 'Severe Weather Preparation',
        content: 'Before storm season: secure rooftop equipment against high winds, clean condensate drains to prevent flooding, verify emergency shutoff procedures, test generator operation under HVAC load, and confirm your service contractor\'s emergency response capabilities and typical response times.',
      },
      {
        heading: 'Service Agreement Benefits',
        content: 'A comprehensive service agreement with a qualified commercial HVAC contractor provides guaranteed emergency response times (often 2-4 hours), priority scheduling during peak demand, discounted emergency labor rates, and a technician team that already knows your equipment. This can be the difference between hours of downtime and days.',
      },
    ],
  },
  {
    title: 'Service Agreement Negotiation Tips for Commercial HVAC Customers',
    category: 'tips',
    tags: ['service-agreements', 'contracts', 'cost-management', 'commercial-hvac'],
    sections: [
      {
        heading: 'Why Service Agreements Matter',
        content: 'A well-structured HVAC service agreement provides predictable maintenance costs, priority emergency response, and professional oversight of your building\'s most expensive mechanical systems. However, not all service agreements are created equal. Understanding what to negotiate can save thousands of dollars annually while ensuring better service.',
      },
      {
        heading: 'Essential Coverage Items',
        content: '<ul><li><strong>Preventive maintenance visits:</strong> Minimum quarterly for most commercial systems; monthly for critical facilities</li><li><strong>Emergency response guarantee:</strong> Get a specific time commitment in writing (e.g., 2-hour response, 4-hour on-site)</li><li><strong>Parts coverage:</strong> Understand what is included vs. excluded; negotiate caps on excluded parts markup</li><li><strong>Labor rates:</strong> Lock in rates for both scheduled and emergency work</li><li><strong>Refrigerant:</strong> Clarify who pays for refrigerant and at what price; this can be a significant cost</li></ul>',
      },
      {
        heading: 'Red Flags to Watch For',
        content: '<ul><li>Vague language around response times ("as soon as possible" vs. "within 4 hours")</li><li>Excessive exclusions that make the agreement essentially a discount card</li><li>Automatic renewal with significant price escalators</li><li>No performance guarantees or SLAs</li><li>Restriction clauses that prevent you from using other contractors for non-covered work</li></ul>',
      },
      {
        heading: 'Negotiation Strategies',
        content: '<ul><li>Get at least three competitive quotes to benchmark pricing</li><li>Negotiate multi-year terms for better rates but include annual opt-out clauses</li><li>Request equipment condition reports as part of the agreement</li><li>Include performance metrics (uptime percentage, response time tracking)</li><li>Bundle multiple properties or buildings for volume discounts</li><li>Time your negotiation for off-peak season (late fall) when contractors are more flexible</li></ul>',
      },
      {
        heading: 'Evaluating Agreement Value',
        content: 'A good service agreement should cost 1-3% of your total HVAC equipment replacement value annually. Compare the agreement cost against the projected cost of individual service calls, the risk of unplanned downtime, and the energy savings from proper maintenance. Most commercial building owners find that a quality service agreement pays for itself within the first year.',
      },
    ],
  },
  {
    title: 'ASHRAE Standards Updates: What Changed and What It Means for Your Building',
    category: 'regulations',
    tags: ['ashrae', 'standards', 'regulations', 'commercial-hvac', 'compliance'],
    sections: [
      {
        heading: 'ASHRAE Standards Drive the Industry',
        content: 'The American Society of Heating, Refrigerating and Air-Conditioning Engineers (ASHRAE) sets the technical standards that govern commercial HVAC design, installation, and operation. When ASHRAE updates a standard, it eventually flows into building codes, equipment specifications, and maintenance requirements. Staying current is essential for building owners and facility managers.',
      },
      {
        heading: 'ASHRAE 90.1: Energy Efficiency',
        content: 'The latest update to ASHRAE 90.1 includes more stringent requirements for HVAC system efficiency, expanded economizer requirements, mandatory energy recovery for larger systems, and updated performance paths for compliance. Buildings pursuing LEED certification must meet or exceed the current version of 90.1.',
      },
      {
        heading: 'ASHRAE 62.1: Ventilation',
        content: 'Updates to the ventilation standard reflect post-pandemic priorities, including increased minimum ventilation rates for certain space types, new guidance on air cleaning as a supplement to ventilation, and enhanced requirements for demand-controlled ventilation systems. The addenda also address ventilation for emerging space types like co-working facilities.',
      },
      {
        heading: 'ASHRAE 241: Infection Risk Management',
        content: 'This relatively new standard provides a framework for using ventilation, filtration, and air cleaning to manage airborne infection risk. It introduces the concept of "equivalent clean airflow" and provides target rates by space type and risk level. While not yet widely adopted into code, many health-conscious building owners are voluntarily complying.',
      },
      {
        heading: 'Action Items for Building Owners',
        content: '<ul><li>Review your current HVAC systems against the latest ASHRAE standards</li><li>Consult with your HVAC contractor about compliance gaps</li><li>Budget for upgrades needed to meet new code requirements</li><li>Consider voluntary compliance with ASHRAE 241 as a competitive advantage for tenant attraction</li><li>Document compliance efforts for insurance and regulatory purposes</li></ul>',
      },
    ],
  },
]

// ─── POST /api/admin/blog/generate ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { source_url?: string; topic?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Allow empty body — will auto-generate from topics pool
    }

    const { source_url, topic } = body

    let articleTitle: string
    let articleBody: string
    let articleExcerpt: string
    let articleCategory: string
    let articleTags: string[]
    let sourceName: string | null = null
    let sourceUrl: string | null = null

    if (source_url) {
      // Fetch content from URL and build a template article referencing it
      sourceUrl = source_url
      try {
        const res = await fetch(source_url, {
          headers: { 'User-Agent': 'MyHVACTech-Bot/1.0' },
          signal: AbortSignal.timeout(10000),
        })
        const html = await res.text()

        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
        const pageTitle = titleMatch
          ? titleMatch[1].replace(/\s*[-|–—].*$/, '').trim()
          : 'HVAC Industry Article'

        sourceName = new URL(source_url).hostname.replace('www.', '')

        articleTitle = `Analysis: ${pageTitle}`
        articleCategory = 'industry-news'
        articleTags = ['industry-news', 'analysis', 'curated']
        articleExcerpt = `A curated analysis of "${pageTitle}" from ${sourceName}, with insights for commercial HVAC professionals and building managers.`

        articleBody = `
<p class="lead">This article provides analysis and commentary on a recent industry publication. <a href="${source_url}" target="_blank" rel="noopener noreferrer">Read the original article at ${sourceName}</a>.</p>

<h2>Overview</h2>
<p>The original article from ${sourceName} discusses important developments in the commercial HVAC industry. Below is our analysis with key takeaways for building owners and facility managers.</p>

<h2>Key Takeaways</h2>
<ul>
  <li><strong>Industry Impact:</strong> [Edit this section with specific impacts discussed in the source article]</li>
  <li><strong>What This Means for Building Owners:</strong> [Add analysis of how this affects commercial building operations]</li>
  <li><strong>Action Items:</strong> [List specific steps readers should consider]</li>
</ul>

<h2>Our Analysis</h2>
<p>[Add your expert commentary on the article's main points. Discuss how this relates to current industry trends and what commercial HVAC professionals should know.]</p>

<h2>Recommendations</h2>
<p>Based on this development, we recommend that commercial building owners and facility managers:</p>
<ol>
  <li>[First recommendation]</li>
  <li>[Second recommendation]</li>
  <li>[Third recommendation]</li>
</ol>

<h2>How My HVAC Tech Can Help</h2>
<p>Finding the right commercial HVAC contractor to address these industry developments is critical. <a href="/">Search our directory</a> to connect with qualified, verified contractors in your area who can help you stay ahead of industry changes.</p>
`.trim()
      } catch {
        return NextResponse.json(
          { error: 'Failed to fetch the source URL. Please check the URL and try again.' },
          { status: 400 }
        )
      }
    } else if (topic) {
      // Generate article from a custom topic
      articleTitle = topic.charAt(0).toUpperCase() + topic.slice(1)
      articleCategory = 'industry-news'
      articleTags = ['commercial-hvac', topic.toLowerCase().replace(/\s+/g, '-')]
      articleExcerpt = `An in-depth guide to ${topic.toLowerCase()} for commercial building owners, facility managers, and HVAC professionals.`

      articleBody = `
<p class="lead">This article explores ${topic.toLowerCase()} and its implications for the commercial HVAC industry.</p>

<h2>Introduction</h2>
<p>${topic} is an important consideration for commercial building owners and facility managers. Understanding the key aspects can help reduce costs, improve efficiency, and ensure compliance with industry standards.</p>

<h2>Key Considerations</h2>
<ul>
  <li><strong>Cost Impact:</strong> [Discuss how this topic affects operating budgets and capital planning]</li>
  <li><strong>Efficiency:</strong> [Explain the relationship between this topic and HVAC system efficiency]</li>
  <li><strong>Compliance:</strong> [Note any regulatory or code requirements related to this topic]</li>
  <li><strong>Best Practices:</strong> [List industry best practices]</li>
</ul>

<h2>Detailed Analysis</h2>
<p>[Add detailed content about ${topic.toLowerCase()}. Include statistics, case studies, and expert insights where available.]</p>

<h2>Implementation Guide</h2>
<ol>
  <li><strong>Assessment:</strong> [Describe the initial assessment process]</li>
  <li><strong>Planning:</strong> [Outline the planning phase]</li>
  <li><strong>Execution:</strong> [Detail the implementation steps]</li>
  <li><strong>Verification:</strong> [Explain how to verify successful implementation]</li>
</ol>

<h2>Finding the Right Contractor</h2>
<p>Working with a qualified commercial HVAC contractor is essential when addressing ${topic.toLowerCase()}. <a href="/">Search our directory</a> to find experienced, verified contractors in your area.</p>
`.trim()
    } else {
      // Auto-generate from curated topics pool
      const randomTopic = TOPICS_POOL[Math.floor(Math.random() * TOPICS_POOL.length)]

      articleTitle = randomTopic.title
      articleCategory = randomTopic.category
      articleTags = randomTopic.tags
      articleExcerpt = randomTopic.sections[0].content.slice(0, 300)

      // Build HTML from sections
      const sectionsHtml = randomTopic.sections
        .map(
          (section) =>
            `<h2>${section.heading}</h2>\n${section.content.startsWith('<') ? section.content : `<p>${section.content}</p>`}`
        )
        .join('\n\n')

      articleBody = `<p class="lead">${randomTopic.sections[0].content.slice(0, 200)}...</p>\n\n${sectionsHtml}\n\n<h2>Find a Qualified Commercial HVAC Contractor</h2>\n<p>Need help implementing these recommendations? <a href="/">Search our directory</a> to connect with verified commercial HVAC contractors in your area who specialize in the services discussed in this article.</p>`
    }

    // Generate slug
    let slug = generateSlug(articleTitle)

    const db = createAdminClient()

    // De-duplicate slug
    const { data: existing } = await db
      .from('blog_posts')
      .select('slug')
      .like('slug', `${slug}%`)

    if (existing && existing.length > 0) {
      const existingSlugs = new Set(existing.map((p: { slug: string }) => p.slug))
      if (existingSlugs.has(slug)) {
        let counter = 2
        while (existingSlugs.has(`${slug}-${counter}`)) {
          counter++
        }
        slug = `${slug}-${counter}`
      }
    }

    const now = new Date().toISOString()

    const insertData = {
      title: articleTitle,
      slug,
      body: articleBody,
      excerpt: articleExcerpt.slice(0, 300),
      category: articleCategory,
      tags: articleTags,
      cover_image_url: null,
      status: 'draft',
      source_url: sourceUrl,
      source_name: sourceName,
      is_auto_generated: true,
      author_name: 'My HVAC Tech',
      author_email: admin.email,
      meta_title: `${articleTitle} | My HVAC Tech Blog`,
      meta_description: articleExcerpt.slice(0, 160),
      published_at: null,
      updated_at: now,
    }

    const { data: post, error } = await db
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Admin blog generate error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('Admin blog generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
