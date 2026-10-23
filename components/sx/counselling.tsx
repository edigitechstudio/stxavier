'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { captureUtm } from '@/lib/utm';
import { LeadForm, type LeadOptions, type LeadPrefill } from './lead-form';
import { Modal } from './modal';

type Ctx = { open: (prefill?: LeadPrefill) => void; options: LeadOptions };

const CounsellingContext = createContext<Ctx>({ open: () => {}, options: { destinations: [], intakes: [] } });
export const useCounselling = () => useContext(CounsellingContext);

/** Provides `open()` to every "Get Started / Book Counselling" button and renders the lead-form modal. */
export function CounsellingProvider({ options, children }: { options: LeadOptions; children: ReactNode }) {
  const t = useTranslations('counselling');
  const [prefill, setPrefill] = useState<LeadPrefill | null>(null);
  // Bumped on every open so the form remounts fresh (cleared errors / success state).
  const [session, setSession] = useState(0);
  const open = useCallback((p: LeadPrefill = {}) => {
    setPrefill(p);
    setSession((n) => n + 1);
  }, []);
  const close = useCallback(() => setPrefill(null), []);
  const value = useMemo(() => ({ open, options }), [open, options]);

  useEffect(() => captureUtm(), []);

  return (
    <CounsellingContext.Provider value={value}>
      {children}
      <Modal open={prefill !== null} onClose={close} label={t('title')} closeLabel={t('close')}>
        <LeadForm
          key={session}
          source="counselling"
          options={options}
          prefill={prefill ?? {}}
          onDone={close}
          header={
            <>
              <span className="eyebrow">{t('eyebrow')}</span>
              <h3>{t('title')}</h3>
              <p className="muted">{t('subtitle')}</p>
            </>
          }
        />
      </Modal>
    </CounsellingContext.Provider>
  );
}

/** Any button that opens the counselling modal. */
export function CounsellingButton({ className, children, prefill }: { className?: string; children: ReactNode; prefill?: LeadPrefill }) {
  const { open } = useCounselling();
  return (
    <button type="button" className={className} onClick={() => open(prefill)}>
      {children}
    </button>
  );
}

/** Inline lead form that reuses the provider's destination/intake options. */
export function InlineLeadForm(props: Omit<React.ComponentProps<typeof LeadForm>, 'options'>) {
  const { options } = useCounselling();
  return <LeadForm options={options} {...props} />;
}
