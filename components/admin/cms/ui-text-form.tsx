'use client';
import { useActionState, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, Save } from 'lucide-react';
import { saveUiTextAction, type SaveState } from '@/app/admin/cms/actions';

export type UiRow = { key: string; en: string; ne: string; enDefault: string; neDefault: string };

/** Interface text of one group (or a search result) in both languages. Empty = default text. */
export function UiTextForm({ ns, rows }: { ns: string; rows: UiRow[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveUiTextAction, {});
  const [values, setValues] = useState(() => Object.fromEntries(rows.flatMap((r) => [[`en:${r.key}`, r.en], [`ne:${r.key}`, r.ne]])));
  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <form action={action} className="cms-form">
      <input type="hidden" name="ns" value={ns} />
      <div className="ui-rows">
        {rows.map((r) => {
          const changed = values[`en:${r.key}`] !== r.enDefault || values[`ne:${r.key}`] !== r.neDefault;
          return (
            <div key={r.key} className={`ui-row ${changed ? 'is-changed' : ''}`}>
              <div className="ui-key">
                <code>{r.key}</code>
                {changed && (
                  <button type="button" className="cms-clear" title="Back to default text" aria-label={`Reset ${r.key}`} onClick={() => { set(`en:${r.key}`, r.enDefault); set(`ne:${r.key}`, r.neDefault); }}>
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
              {(['en', 'ne'] as const).map((lang) => {
                const name = `${lang}:${r.key}`;
                const def = lang === 'en' ? r.enDefault : r.neDefault;
                const long = def.length > 80;
                const props = { name, lang, value: values[name], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(name, e.target.value), 'aria-label': `${r.key} (${lang === 'en' ? 'English' : 'Nepali'})` };
                return long ? <textarea key={lang} rows={3} {...props} /> : <input key={lang} {...props} />;
              })}
            </div>
          );
        })}
      </div>
      <div className="cms-savebar">
        {state.errors?.length ? (
          <ul className="cms-errors" role="alert">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        ) : state.saved ? (
          <p className="cms-saved" role="status"><CheckCircle2 size={16} aria-hidden /> Saved and published</p>
        ) : (
          <p className="muted">Words in {'{braces}'} are filled in automatically — keep them.</p>
        )}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} Save & publish
        </button>
      </div>
    </form>
  );
}
