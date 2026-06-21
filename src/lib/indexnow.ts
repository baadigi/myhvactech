// IndexNow — instantly notify Bing, Yandex, Naver (and others) of new/updated
// URLs. Key is published at https://myhvac.tech/<key>.txt (public by design).
// Does NOT affect Google (Google doesn't use IndexNow).

const INDEXNOW_KEY = 'abd1c1117a6d5f775cb0754f0dc01856'
const HOST = 'myhvac.tech'

// Fire-and-forget: never throw, so a failed ping can't break a publish flow.
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    })
    if (!res.ok) {
      console.error('IndexNow non-OK:', res.status, (await res.text()).slice(0, 200))
    }
  } catch (err) {
    console.error('IndexNow submit failed:', err)
  }
}
