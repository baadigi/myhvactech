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
