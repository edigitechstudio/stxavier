'use client';
import { openConsentSettings } from '@/lib/consent';

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentSettings}>
      {label}
    </button>
  );
}
