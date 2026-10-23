'use client';
/** First-touch UTM capture, kept for the browser session and attached to every lead. */
const KEY = 'sx-utm';
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export type Utm = Partial<Record<(typeof FIELDS)[number], string>>;

export function captureUtm() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Utm = {};
    for (const f of FIELDS) {
      const v = params.get(f);
      if (v) utm[f] = v.slice(0, 200);
    }
    sessionStorage.setItem(KEY, JSON.stringify({ utm, referrer: document.referrer.slice(0, 500) }));
  } catch {
    /* storage unavailable */
  }
}

export function readUtm(): { utm: Utm; referrer?: string } {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '') as { utm: Utm; referrer?: string };
  } catch {
    return { utm: {} };
  }
}
