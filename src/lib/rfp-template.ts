// Editable commercial HVAC RFP (Request for Proposal) template. Facility managers
// download this to send to contractors so bids are apples-to-apples. Plain text
// so it opens anywhere and pastes into any doc.

export function buildRfpTemplate(): string {
  return `COMMERCIAL HVAC — REQUEST FOR PROPOSAL (RFP)
=================================================
Prepared by My HVAC Tech  ·  myhvac.tech/resources

Fill in the bracketed sections, then send to 3+ vetted contractors so every
bid covers the same scope. Apples-to-apples bids = better pricing and fewer
surprise change orders.


1. PROJECT OVERVIEW
-------------------
- Company / property owner: [______]
- Property name & address: [______]
- Building type (office, retail, warehouse, healthcare, etc.): [______]
- Approx. square footage: [______]
- Number of buildings / floors: [______]
- Primary contact (name, email, phone): [______]


2. SCOPE OF WORK
----------------
[ ] Replacement of existing system
[ ] New installation
[ ] Repair / troubleshooting
[ ] Preventive-maintenance agreement
[ ] Other: [______]

Describe the work, known issues, and goals (efficiency, comfort, reliability):
[______]


3. EXISTING SYSTEM (if known)
-----------------------------
- System type(s) (RTU, split, VRF, chiller, boiler, etc.): [______]
- Approx. age / condition: [______]
- Total tonnage / capacity (if known): [______]
- Brand(s) / model(s): [______]
- Known problems: [______]


4. REQUIREMENTS
---------------
- Energy-efficiency targets (SEER2/IEER, if any): [______]
- Controls / building-automation integration: [______]
- Zoning / number of zones: [______]
- Refrigerant requirements (e.g., low-GWP / A2L): [______]
- Code / permit considerations: [______]


5. CONTRACTOR QUALIFICATIONS (require with the bid)
---------------------------------------------------
[ ] Active state contractor / mechanical license (number: ______)
[ ] Certificate of insurance (general liability + workers' comp)
[ ] 3+ references on similar COMMERCIAL projects
[ ] Commercial (not residential) experience with this system type
[ ] Manufacturer certifications (Carrier, Trane, Daikin, etc.)
[ ] Written warranty on parts AND labor
[ ] Emergency / after-hours response capability + typical response time


6. BID SUBMISSION REQUIREMENTS
------------------------------
Please provide an itemized, written proposal including:
- Equipment make/model and efficiency ratings
- Labor, crane/rigging, electrical, controls, permits (itemized)
- Project timeline and milestones
- Payment schedule
- Warranty terms (parts + labor)
- Optional: maintenance-agreement pricing


7. TIMELINE
-----------
- RFP issued: [______]
- Questions due: [______]
- Bids due: [______]
- Target start / completion: [______]


8. EVALUATION CRITERIA
----------------------
Bids will be evaluated on: total cost, scope completeness, equipment quality
and efficiency, contractor qualifications/references, warranty, and timeline.
Lowest price is not automatically selected.


-------------------------------------------------
Find and compare vetted commercial HVAC contractors at myhvac.tech.
`
}
