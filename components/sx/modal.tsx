'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Accessible modal: Esc closes, focus moves in and returns, page scroll locks. */
export function Modal({
  open,
  onClose,
  label,
  closeLabel,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current
      ?.querySelector<HTMLElement>('input:not([type=hidden]):not([tabindex="-1"]), select:not([tabindex="-1"]), textarea, button:not(.modal-close):not([tabindex="-1"])')
      ?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop sx-root" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={closeLabel}>
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
