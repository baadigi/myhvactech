/**
 * Fire a custom GA4 event via gtag.
 * Safe to call anywhere — silently no-ops if gtag isn't loaded.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

/**
 * Scope Agent funnel events — scope_agent_open, scope_agent_message_sent,
 * scope_agent_shortlist_shown, scope_agent_email_submitted, scope_agent_lead_created.
 */
export function trackScopeAgent(
  step: 'open' | 'message_sent' | 'shortlist_shown' | 'email_submitted' | 'lead_created',
  params?: Record<string, string | number | boolean | undefined>
) {
  trackEvent(`scope_agent_${step}`, params)
}
