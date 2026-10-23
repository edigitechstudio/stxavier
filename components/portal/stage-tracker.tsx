import { Check } from 'lucide-react';
import { APP_STAGES, stageIndex, type AppStage } from '@/types/portal';

/**
 * Visual stepper: Documents → Applied → Offer → CAS/CoE → Visa lodged → Visa granted → Pre-departure.
 * Shared by the student portal and the admin application page (labels passed in).
 */
export function StageTracker({ stage, labels, descriptions, compact = false }: { stage: AppStage; labels: Record<AppStage, string>; descriptions?: Record<AppStage, string>; compact?: boolean }) {
  const current = stageIndex(stage);
  return (
    <ol className={`tracker ${compact ? 'is-compact' : ''}`}>
      {APP_STAGES.map((s, i) => {
        const state = i < current ? 'is-done' : i === current ? 'is-current' : '';
        return (
          <li key={s} className={state} aria-current={i === current ? 'step' : undefined}>
            <span className="tracker-dot">{i < current ? <Check size={14} strokeWidth={3} aria-hidden /> : i + 1}</span>
            <span className="tracker-label">{labels[s]}</span>
            {descriptions && i === current && <span className="tracker-desc">{descriptions[s]}</span>}
          </li>
        );
      })}
    </ol>
  );
}
