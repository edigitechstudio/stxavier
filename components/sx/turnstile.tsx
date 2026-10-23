'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Cloudflare Turnstile for a form. Renders in "interaction-only" mode, so most visitors never see
 * a challenge. Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it renders nothing and `token` stays
 * undefined (the server then skips verification).
 */
export function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    const el = ref.current;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widget.current = window.turnstile.render(el, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          theme: 'auto',
          size: 'flexible',
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(undefined),
          'error-callback': () => setToken(undefined),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setToken(undefined);
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, []);

  return { element: SITE_KEY ? <div ref={ref} className="turnstile" /> : null, token, reset, enabled: !!SITE_KEY };
}
