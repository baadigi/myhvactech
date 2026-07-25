import { TRADE_KEY } from './trade-scope'

// Trade-scope guard for auto-generated blog content. Stops one trade's article
// from being published on another trade's site (e.g. a roofing post on
// myelectrical.tech). Backstops the trade filter on the topic queue — see
// src/app/api/cron/scan-news/route.ts.
//
// `own` = the site's own vocabulary, kept GENEROUS so legitimate cross-mentions
// pass (an HVAC post can say "roof" without being flagged). `mark` = the
// DISTINCTIVE service nouns of a trade that almost never appear incidentally —
// these are what identify a title as belonging to another trade.
const TRADE_VOCAB: Record<string, { own: RegExp; mark: RegExp }> = {
  roofing: {
    own: /\broof(s|ing|er|ers|top)?\b|shingle|membrane|\btpo\b|\bepdm\b|parapet|flashing|gutter|skylight|waterproof|coating|leak/i,
    mark: /\broof(s|ing)?\b|shingle|\btpo\b|\bepdm\b|parapet|re-?roof/i,
  },
  plumbing: {
    own: /plumb|pipe|drain|sewer|backflow|water heater|hydro.?jet|grease trap|fixture|valve|water line/i,
    mark: /plumb|sewer|backflow|hydro.?jet|grease trap|\bp-?trap\b/i,
  },
  electrical: {
    own: /electric|electrician|wiring|panel|breaker|switchgear|busway|transformer|\bgrid\b|voltage|lighting|\bev charg|generator|conduit|power/i,
    mark: /electrician|switchgear|busway|panelboard|\bev charg|\bkva\b/i,
  },
  hvac: {
    own: /\bhvac\b|furnace|boiler|chiller|refrigerant|air ?condition|\brtu\b|rooftop unit|condenser|heat pump|air handler|ductwork|cooling|heating/i,
    mark: /\bhvac\b|furnace|chiller|refrigerant|\brtu\b|condenser|heat pump|air handler/i,
  },
  fire: {
    own: /fire|sprinkler|alarm|suppress|standpipe|extinguisher|\bnfpa\b|smoke detect/i,
    mark: /fire sprinkler|fire alarm|fire suppress|standpipe/i,
  },
  accesscontrol: {
    own: /access control|card reader|key.?fob|badge|biometric|turnstile|keypad|credential|door controller|intercom/i,
    mark: /access control|card reader|key.?fob|badge reader|biometric|turnstile/i,
  },
  // Building maintenance spans many systems, so it never marks others and nothing
  // marks it — everything passes.
  maintenance: { own: /.*/, mark: /a^/ },
  msp: {
    own: /\bit\b|managed it|cyber|ransomware|microsoft 365|\bmsp\b|\bvcio\b|firewall|phishing|cloud|backup|network|endpoint|compliance|helpdesk/i,
    mark: /managed it|ransomware|microsoft 365|\bmsp\b|\bvcio\b|phishing|endpoint/i,
  },
}

// Returns a reason string when `title` reads as another trade's content for the
// active site, else null. Off-trade = hits another trade's distinctive terms
// while containing NONE of this site's own vocabulary. Conservative by design.
export function offTradeReason(title: string): string | null {
  const here = TRADE_VOCAB[TRADE_KEY]
  if (!here || here.own.test(title)) return null // own vocab present → on-trade
  for (const [trade, v] of Object.entries(TRADE_VOCAB)) {
    if (trade !== TRADE_KEY && v.mark.test(title)) {
      return `title reads as ${trade}, not ${TRADE_KEY}`
    }
  }
  return null
}
