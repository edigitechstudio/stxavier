'use client';
import { Printer } from 'lucide-react';

/** Opens the browser print dialog, "Save as PDF" turns the guide into a downloadable PDF. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
      <Printer size={18} aria-hidden /> {label}
    </button>
  );
}
