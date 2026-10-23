'use client';
import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, ImagePlus, Images, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { saveEntryAction, type SaveState } from '@/app/admin/cms/actions';
import { blank, humanize, kindOf, normalizePath, titleOf, type Kind } from '@/lib/cms/shape';

type J = unknown;
type Ctx = { nullable: Set<string>; suggestions: Record<string, string[]>; lockKey?: string };

const IMAGE_KEY = /(image|photo|logo|cover|avatar|thumbnail|poster|icon_url|og_image)$/i;
const LONG_KEY = /(body|answer|text|description|intro|summary|bio|story|note|content|message|overview|details|quote|extra_instructions|disclaimer|greeting|lead)$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function guessKind(name: string): Kind {
  if (IMAGE_KEY.test(name)) return 'string';
  return 'localized';
}

/** Immutable update helpers. */
const setKey = (obj: J, key: string, v: J) => ({ ...(obj as Record<string, J>), [key]: v });
const setIndex = (arr: J[], i: number, v: J) => arr.map((x, j) => (j === i ? v : x));
const move = (arr: J[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export function EntryEditor({
  collectionKey,
  id,
  pk,
  initial,
  sample,
  nullable,
  suggestions,
  viewHref,
}: {
  collectionKey: string;
  id: string | null;
  pk: string;
  initial: J;
  sample: J;
  nullable: string[];
  suggestions: Record<string, string[]>;
  viewHref: string | null;
}) {
  const [value, setValue] = useState<J>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEntryAction, {});
  const [dirty, setDirty] = useState(false);
  const ctx = useMemo<Ctx>(() => ({ nullable: new Set(nullable), suggestions, lockKey: id ? pk : undefined }), [nullable, suggestions, id, pk]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <form
      action={(fd) => {
        setDirty(false);
        action(fd);
      }}
      className="cms-form"
    >
      <input type="hidden" name="collection" value={collectionKey} />
      <input type="hidden" name="id" value={id ?? ''} />
      <input type="hidden" name="json" value={JSON.stringify(value)} />
      <Field
        name=""
        path=""
        value={value}
        sample={sample}
        ctx={ctx}
        depth={0}
        onChange={(v) => {
          setValue(v);
          setDirty(true);
        }}
      />
      <div className="cms-savebar" role="region" aria-label="Save">
        {state.errors?.length ? (
          <ul className="cms-errors" role="alert">
            {state.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        ) : state.saved && !dirty ? (
          <p className="cms-saved" role="status"><CheckCircle2 size={16} aria-hidden /> Saved and published</p>
        ) : dirty ? (
          <p className="muted">Unsaved changes</p>
        ) : null}
        {viewHref && (
          <a href={viewHref} target="_blank" rel="noopener" className="btn btn-outline btn-sm"><ExternalLink size={15} aria-hidden /> View on site</a>
        )}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} {id ? 'Save & publish' : 'Create'}
        </button>
      </div>
    </form>
  );
}

/** Collapsible panel: a toggle button plus sibling actions (buttons can't live inside <summary>). */
function Disclosure({ className, title, actions, defaultOpen, children }: { className: string; title: ReactNode; actions?: ReactNode; defaultOpen: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${className} ${open ? 'is-open' : ''}`}>
      <div className="cms-disclosure-head">
        <button type="button" className="cms-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span>{title}</span>
        </button>
        {actions}
      </div>
      {open && children}
    </div>
  );
}

function Field({ name, path, value, sample, ctx, depth, onChange, ariaLabel }: { name: string; path: string; value: J; sample: J; ctx: Ctx; depth: number; onChange: (v: J) => void; ariaLabel?: string }) {
  const label = name ? humanize(name) : '';
  const aria = name ? undefined : ariaLabel;
  const norm = normalizePath(path);
  const canClear = !!name && ctx.nullable.has(norm);
  const vk = kindOf(value);
  const sk = kindOf(sample);

  if (vk === 'null') {
    const kind = sk !== 'null' ? sk : guessKind(name);
    return (
      <div className="cms-field cms-empty">
        <span className="cms-label">{label}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(sk !== 'null' ? blank(sample) : kind === 'string' ? '' : { en: '', ne: '' })}>
          <Plus size={14} aria-hidden /> Add {label.toLowerCase() || 'value'}
        </button>
      </div>
    );
  }

  const clear = canClear ? (
    <button type="button" className="cms-clear" onClick={() => onChange(null)} aria-label={`Remove ${label}`} title="Remove (leave empty)">
      <X size={14} />
    </button>
  ) : null;

  if (vk === 'boolean') {
    return (
      <label className="cms-check">
        <input type="checkbox" checked={value as boolean} onChange={(e) => onChange(e.target.checked)} /> {label}
        {name === 'is_placeholder' && <small className="muted"> — placeholder entries never appear on the live site</small>}
        {name === 'published' && <small className="muted"> — show on the website</small>}
      </label>
    );
  }

  if (vk === 'number') {
    return (
      <label className="cms-field">
        <span className="cms-label">{label}{clear}</span>
        <input type="number" step="any" aria-label={aria} value={Number.isFinite(value as number) ? (value as number) : 0} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
      </label>
    );
  }

  if (vk === 'string') {
    const s = value as string;
    const locked = depth === 1 && ctx.lockKey === name;
    if (IMAGE_KEY.test(name) || /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(s)) return <ImageField label={label} value={s} onChange={onChange} clear={clear} />;
    const listId = ctx.suggestions[norm]?.length ? `sg-${norm.replace(/\W/g, '_')}` : undefined;
    const long = LONG_KEY.test(name) || s.length > 100 || s.includes('\n');
    return (
      <label className="cms-field">
        <span className="cms-label">{label}{locked && <small className="muted"> (can’t be changed)</small>}{clear}</span>
        {long ? (
          <textarea aria-label={aria} value={s} rows={Math.min(14, Math.max(3, s.split('\n').length + 1))} onChange={(e) => onChange(e.target.value)} />
        ) : DATE_ONLY.test(s) ? (
          <input type="date" aria-label={aria} value={s} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input aria-label={aria} value={s} disabled={locked} list={listId} onChange={(e) => onChange(e.target.value)} />
        )}
        {listId && <datalist id={listId}>{ctx.suggestions[norm].map((o) => <option key={o} value={o} />)}</datalist>}
      </label>
    );
  }

  if (vk === 'localized') {
    const v = value as { en: string; ne?: string | null };
    const long = LONG_KEY.test(name) || (v.en ?? '').length > 90 || (v.en ?? '').includes('\n');
    const input = (lang: 'en' | 'ne') => {
      const text = (lang === 'en' ? v.en : v.ne) ?? '';
      const set = (t: string) => onChange({ ...v, [lang]: lang === 'ne' && !t ? null : t });
      return long ? (
        <textarea lang={lang} aria-label={aria && `${aria} (${lang === 'en' ? 'English' : 'Nepali'})`} value={text} rows={Math.min(12, Math.max(3, text.split('\n').length + 1))} onChange={(e) => set(e.target.value)} placeholder={lang === 'ne' ? 'नेपाली (खाली छोडे अंग्रेजी देखिन्छ)' : 'English'} />
      ) : (
        <input lang={lang} aria-label={aria && `${aria} (${lang === 'en' ? 'English' : 'Nepali'})`} value={text} onChange={(e) => set(e.target.value)} placeholder={lang === 'ne' ? 'नेपाली (optional)' : 'English'} />
      );
    };
    return (
      <div className="cms-field">
        <span className="cms-label">{label}{clear}</span>
        <div className="cms-pair">
          <label><small>EN</small>{input('en')}</label>
          <label><small>ने</small>{input('ne')}</label>
        </div>
      </div>
    );
  }

  if (vk === 'array') {
    const arr = value as J[];
    const itemSample = Array.isArray(sample) && sample.length ? sample[0] : arr[0] ?? '';
    const itemKind = kindOf(itemSample);
    const simple = itemKind === 'string' || itemKind === 'number' || itemKind === 'localized';
    return (
      <fieldset className={`cms-array ${simple ? 'is-simple' : ''}`}>
        <legend className="cms-label">{label} <small className="muted">({arr.length})</small>{clear}</legend>
        {arr.map((item, i) => {
          const itemName = `${label || 'item'} ${i + 1}`;
          const controls = (
            <span className="cms-item-actions">
              <button type="button" onClick={() => onChange(move(arr, i, -1))} disabled={i === 0} aria-label={`Move ${itemName} up`}><ArrowUp size={14} /></button>
              <button type="button" onClick={() => onChange(move(arr, i, 1))} disabled={i === arr.length - 1} aria-label={`Move ${itemName} down`}><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(arr.filter((_, j) => j !== i))} aria-label={`Remove ${itemName}`}><Trash2 size={14} /></button>
            </span>
          );
          const field = <Field name="" ariaLabel={itemName} path={`${path}[${i}]`} value={item} sample={itemSample} ctx={ctx} depth={depth + 1} onChange={(v) => onChange(setIndex(arr, i, v))} />;
          return simple ? (
            <div key={i} className="cms-item is-simple">
              {field}
              {controls}
            </div>
          ) : (
            <Disclosure key={i} className="cms-item" title={titleOf(item, `Item ${i + 1}`)} actions={controls} defaultOpen={arr.length <= 2}>
              {field}
            </Disclosure>
          );
        })}
        <button type="button" className="btn btn-outline btn-sm cms-add" onClick={() => onChange([...arr, blank(itemSample)])}>
          <Plus size={14} aria-hidden /> Add {label ? label.toLowerCase().replace(/s$/, '') : 'item'}
        </button>
      </fieldset>
    );
  }

  // Object: show its fields; nested objects are collapsible.
  const obj = value as Record<string, J>;
  const s = (sample && typeof sample === 'object' && !Array.isArray(sample) ? sample : {}) as Record<string, J>;
  const keys = [...new Set([...Object.keys(s), ...Object.keys(obj)])].filter((k) => k !== 'updated_at' && k !== 'created_at');
  // Booleans and short fields first reads better: keep source order but group checkboxes at the top.
  const ordered = [...keys.filter((k) => typeof obj[k] === 'boolean'), ...keys.filter((k) => typeof obj[k] !== 'boolean')];
  const fields = ordered.map((k) => (
    <Field key={k} name={k} path={path ? `${path}.${k}` : k} value={obj[k] ?? null} sample={s[k] ?? null} ctx={ctx} depth={depth + 1} onChange={(v) => onChange(setKey(obj, k, v))} />
  ));
  if (!name) return <div className={depth === 0 ? 'cms-root' : 'cms-object'}>{fields}</div>;
  return (
    <Disclosure className="cms-group" title={label} actions={clear} defaultOpen={depth < 2}>
      <div className="cms-object">{fields}</div>
    </Disclosure>
  );
}

function ImageField({ label, value, onChange, clear }: { label: string; value: string; onChange: (v: J) => void; clear: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<{ url: string; name: string }[] | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function upload(f: File) {
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.set('file', f);
    const res = await fetch('/api/admin/media', { method: 'POST', body: data }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    setBusy(false);
    if (res?.ok && body?.url) onChange(body.url);
    else setError(body?.error ?? 'Upload failed');
  }

  async function openLibrary() {
    if (library) return setLibrary(null);
    const res = await fetch('/api/admin/media').catch(() => null);
    setLibrary(res?.ok ? ((await res.json()) as { items: { url: string; name: string }[] }).items : []);
  }

  return (
    <div className="cms-field">
      <span className="cms-label">{label}{clear}</span>
      <div className="cms-image">
        <span className="cms-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any URL */}
          {value ? <img src={value} alt="" /> : <ImagePlus size={22} aria-hidden />}
        </span>
        <div className="cms-image-controls">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or upload" aria-label={`${label} URL`} />
          <div className="row-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => file.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <ImagePlus size={14} aria-hidden />} Upload
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={openLibrary} aria-expanded={!!library}><Images size={14} aria-hidden /> Library</button>
          </div>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
      </div>
      {library && (
        <div className="cms-library">
          {library.length === 0 && <p className="muted">No uploaded images yet.</p>}
          {library.map((m) => (
            <button key={m.url} type="button" onClick={() => { onChange(m.url); setLibrary(null); }} title={m.name}>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={m.url} alt={m.name} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

