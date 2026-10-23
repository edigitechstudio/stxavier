'use client';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Lock, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/brand/flag';
import { InlineLeadForm } from '@/components/sx/counselling';
import { Link } from '@/i18n/navigation';
import { rankDestinations, type EligibilityAnswers, type Match } from '@/lib/calc/eligibility';
import { gpaToPercent } from '@/lib/calc/gpa';
import { LEVELS, type GradeBand, type Level } from '@/types/tools';
import { Segmented, useFormatters } from './shared';
import type { ToolDestination } from './types';

type Field = { value: string; label: string };
const STEPS = ['level', 'grades', 'english', 'budget', 'countries', 'field'] as const;
type Step = (typeof STEPS)[number];

export function EligibilityChecker({ destinations, fields, gradeBands }: { destinations: ToolDestination[]; fields: Field[]; gradeBands: GradeBand[] }) {
  const t = useTranslations('tools');
  const te = useTranslations('tools.eligibility');
  const fmt = useFormatters();
  const usable = destinations.filter((d) => d.requirements);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'gate' | 'results'>('quiz');
  const [level, setLevel] = useState<Level>('pg');
  const [gradeType, setGradeType] = useState<'percent' | 'gpa'>('percent');
  const [grade, setGrade] = useState('70');
  const [test, setTest] = useState<'ielts' | 'pte' | 'none'>('ielts');
  const [score, setScore] = useState('6.5');
  const [budgetLakh, setBudgetLakh] = useState(35);
  const [countries, setCountries] = useState<string[]>([]);
  const [field, setField] = useState(fields[0]?.value ?? '');

  const percent = gradeType === 'percent' ? Number(grade) : (gpaToPercent(gradeBands, Number(grade), 4) ?? 0);
  const gradeValid = gradeType === 'percent' ? Number(grade) >= 0 && Number(grade) <= 100 && grade !== '' : Number(grade) >= 0 && Number(grade) <= 4 && grade !== '';
  const scoreNum = Number(score);
  const scoreValid = test === 'none' || (test === 'ielts' ? scoreNum >= 0 && scoreNum <= 9 : scoreNum >= 10 && scoreNum <= 90);

  const answers: EligibilityAnswers = {
    level,
    percent,
    english: { test, score: test === 'none' ? null : scoreNum },
    budgetNpr: budgetLakh * 100_000,
    countries,
    field,
  };
  const matches: Match[] = useMemo(
    () => (phase === 'quiz' ? [] : rankDestinations(answers, usable.map((d) => ({ slug: d.slug, requirements: d.requirements })))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when the quiz finishes
    [phase],
  );

  const current: Step = STEPS[step];
  const canNext = current === 'grades' ? gradeValid : current === 'english' ? scoreValid : true;
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : setPhase('gate'));
  const restart = () => {
    setPhase('quiz');
    setStep(0);
  };
  const byslug = (slug: string) => usable.find((d) => d.slug === slug)!;

  const option = (selected: boolean, onClick: () => void, label: React.ReactNode, key: string) => (
    <button key={key} type="button" className="option" aria-pressed={selected} onClick={onClick}>
      {label}
    </button>
  );

  if (phase !== 'quiz') {
    const locked = phase === 'gate';
    return (
      <div className="tool-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">{te('resultsTitle')}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={restart}><RotateCcw size={16} aria-hidden /> {te('startOver')}</button>
        </div>
        <p className="tool-note mb-5">{te('disclaimer')}</p>

        {matches.length === 0 && <p className="note-card">{te('noMatches')}</p>}

        {locked && matches.length > 0 && (
          <div className="lock-card mb-5">
            <h3 className="flex items-center gap-2 text-lg font-extrabold"><Lock size={18} aria-hidden /> {te('unlockTitle')}</h3>
            <p className="muted mb-4">{te('unlockBody')}</p>
            <InlineLeadForm
              source="eligibility"
              showDestination={false}
              submitLabel={te('unlock')}
              onSuccess={() => setPhase('results')}
              prefill={{ destination: byslug(matches[0].slug).name }}
              answers={{
                level,
                percent: Math.round(percent * 10) / 10,
                english_test: test,
                english_score: test === 'none' ? null : scoreNum,
                budget_npr: budgetLakh * 100_000,
                countries,
                field,
                top_matches: matches.slice(0, 3).map((m) => `${m.slug}:${m.score}`),
              }}
            />
          </div>
        )}

        <div className="match-list" aria-live="polite">
          {matches.map((m, i) => {
            const d = byslug(m.slug);
            return (
              <article key={m.slug} className={`match-card ${locked && i > 0 ? 'is-locked' : ''}`} aria-hidden={locked && i > 0}>
                <div className="score-ring" style={{ ['--p' as string]: m.score }}>
                  <strong>{m.score}</strong>
                </div>
                <div>
                  <h3><Flag code={d.iso2} /> {d.name} <span className="muted text-sm font-semibold">· {m.score}% {te('match')}</span></h3>
                  <div className="factor-list">
                    {m.factors.map((f) => (
                      <span key={f.factor} className={`status is-${f.status}`}>{te(`factors.${f.factor}`)}: {te(`status.${f.status}`)}</span>
                    ))}
                  </div>
                  {!locked && d.universities.length > 0 && (
                    <p className="text-sm">
                      <Building2 size={14} className="inline align-[-2px]" aria-hidden /> <strong>{te('sampleUnis')}:</strong> {d.universities.slice(0, 3).join(', ')}
                    </p>
                  )}
                  {!locked && (
                    <Link href={`/study-in/${d.slug}`} className="link-arrow mt-2">{te('viewGuide')} <ArrowRight size={15} aria-hidden /></Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="tool-shell" style={{ maxWidth: 820 }}>
      <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={te('step', { n: step + 1, total: STEPS.length })}>
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="quiz-meta"><span>{te('step', { n: step + 1, total: STEPS.length })}</span></p>
      <h2 className="quiz-q">{te(`q.${current}`)}</h2>

      {current === 'level' && <div className="option-grid">{LEVELS.map((lv) => option(level === lv, () => setLevel(lv), t(`levels.${lv}`), lv))}</div>}

      {current === 'grades' && (
        <div className="tool-form">
          <Segmented label={te('gradeType')} value={gradeType} onChange={(v) => { setGradeType(v); setGrade(v === 'gpa' ? '3.2' : '70'); }} options={[{ value: 'percent', label: te('percent') }, { value: 'gpa', label: te('gpa') }]} />
          <label className="field">
            {gradeType === 'percent' ? te('percent') : te('gpa')}
            <input className="control" type="number" inputMode="decimal" step={gradeType === 'gpa' ? 0.01 : 0.1} min={0} max={gradeType === 'gpa' ? 4 : 100} value={grade} onChange={(e) => setGrade(e.target.value)} aria-invalid={!gradeValid} />
            {gradeType === 'gpa' && gradeValid && <small>≈ {fmt.num(percent, 1)}% (NEB)</small>}
          </label>
        </div>
      )}

      {current === 'english' && (
        <div className="tool-form">
          <Segmented label={te('q.english')} value={test} onChange={(v) => { setTest(v); setScore(v === 'pte' ? '58' : '6.5'); }} options={(['ielts', 'pte', 'none'] as const).map((v) => ({ value: v, label: te(`tests.${v}`) }))} />
          {test !== 'none' && (
            <label className="field">
              {te('score')} ({test === 'ielts' ? '0–9' : '10–90'})
              <input className="control" type="number" inputMode="decimal" step={test === 'ielts' ? 0.5 : 1} value={score} onChange={(e) => setScore(e.target.value)} aria-invalid={!scoreValid} />
            </label>
          )}
        </div>
      )}

      {current === 'budget' && (
        <label className="field">
          <small>{te('budgetHint')}</small>
          <div className="range-row">
            <input className="range" type="range" min={10} max={120} step={1} value={budgetLakh} onChange={(e) => setBudgetLakh(Number(e.target.value))} aria-valuetext={fmt.npr(budgetLakh * 100_000)} />
            <span className="range-value" style={{ minWidth: 130 }}>{fmt.npr(budgetLakh * 100_000)}</span>
          </div>
        </label>
      )}

      {current === 'countries' && (
        <div className="chip-toggles" role="group" aria-label={te('q.countries')}>
          <button type="button" className="chip-toggle" aria-pressed={countries.length === 0} onClick={() => setCountries([])}>{te('openToAll')}</button>
          {usable.map((d) => (
            <button
              key={d.slug}
              type="button"
              className="chip-toggle"
              aria-pressed={countries.includes(d.slug)}
              onClick={() => setCountries((c) => (c.includes(d.slug) ? c.filter((x) => x !== d.slug) : [...c, d.slug]))}
            >
              <Flag code={d.iso2} /> {d.name}
            </button>
          ))}
        </div>
      )}

      {current === 'field' && <div className="option-grid">{fields.map((f) => option(field === f.value, () => setField(f.value), f.label, f.value))}</div>}

      <div className="quiz-nav">
        <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
          <ArrowLeft size={16} aria-hidden /> {te('back')}
        </button>
        <button type="button" className="btn btn-primary" onClick={next} disabled={!canNext}>
          {step === STEPS.length - 1 ? te('seeResults') : te('next')} <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
