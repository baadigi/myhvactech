// Central block list for client form spam, kept in the BaaDigi dashboard (blocked_form_senders table).
// Fails open: if the dashboard is slow or down, the lead goes through as normal.
export async function isBlockedSender(email: unknown): Promise<boolean> {
  if (typeof email !== "string" || !email.includes("@")) return false;
  try {
    const res = await fetch(
      `https://app.predictableworkengine.com/api/sites/blocked-sender?email=${encodeURIComponent(email.trim())}`,
      { signal: AbortSignal.timeout(1500), cache: "no-store" },
    );
    return res.ok && (await res.json()).blocked === true;
  } catch {
    return false;
  }
}
