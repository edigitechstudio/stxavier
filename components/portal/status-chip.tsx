import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { DocStatus } from '@/types/portal';

const STATUS_ICON = { pending: Clock, verified: CheckCircle2, reupload_needed: RefreshCw } as const;

/** Document review status: icon + text, never colour alone. */
export function StatusChip({ status, label }: { status: DocStatus; label: string }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`doc-chip is-${status}`}>
      <Icon size={14} aria-hidden /> {label}
    </span>
  );
}
