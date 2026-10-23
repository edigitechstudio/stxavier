'use client';
import { useSyncExternalStore } from 'react';
/**
 * Tiny cookie-consent store (localStorage + window events). No analytics script loads
 * until the visitor chooses "all".
 */
export type Consent = 'all' | 'essential';
const KEY = 'sx-consent';
export const CONSENT_CHANGE = 'sx-consent-change';
export const CONSENT_OPEN = 'sx-consent-open';

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'all' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage blocked — consent applies for this page view only */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE, { detail: value }));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Current consent choice; `null` on the server and until the visitor chooses. */
export function useConsent(): Consent | null {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
