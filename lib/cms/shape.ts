/**
 * Content shapes for the dashboard editor. Content is plain JSON (strings, numbers, booleans,
 * { en, ne } pairs, lists, nested objects). The editor infers each field's type from existing
 * examples, and saves are checked against that shape so an edit can never break a page.
 */
export type Kind = 'null' | 'string' | 'number' | 'boolean' | 'localized' | 'array' | 'object';
type Json = unknown;

export const isLocalized = (v: Json): v is { en: string; ne?: string | null } =>
  !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as Record<string, unknown>).en === 'string' && Object.keys(v).every((k) => k === 'en' || k === 'ne');

export function kindOf(v: Json): Kind {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return 'array';
  if (isLocalized(v)) return 'localized';
  if (typeof v === 'object') return 'object';
  return typeof v as 'string' | 'number' | 'boolean';
}

/** One exemplar merged from many values: every key that appears anywhere, with a non-null example. */
export function sampleOf(values: Json[]): Json {
  const present = values.filter((v) => v !== null && v !== undefined);
  if (!present.length) return null;
  const first = present[0];
  const k = kindOf(first);
  if (k === 'array') {
    const items = present.flatMap((v) => (Array.isArray(v) ? v : []));
    return items.length ? [sampleOf(items)] : [];
  }
  if (k === 'localized') return { en: '', ne: '' };
  if (k === 'object') {
    const objs = present.filter((v) => kindOf(v) === 'object') as Record<string, Json>[];
    const keys = [...new Set(objs.flatMap((o) => Object.keys(o)))];
    return Object.fromEntries(keys.map((key) => [key, sampleOf(objs.map((o) => o[key]))]));
  }
  return first;
}

/**
 * Field paths (array indices written as []) that are null or missing in at least one example →
 * those fields may be left empty.
 */
export function nullablePaths(values: Json[]): string[] {
  const out = new Set<string>();
  const sample = sampleOf(values);
  const walk = (v: Json, s: Json, path: string) => {
    if (v === null || v === undefined) {
      if (path) out.add(path);
      return;
    }
    if (Array.isArray(v)) {
      const item = Array.isArray(s) ? s[0] : undefined;
      v.forEach((x) => walk(x, item, `${path}[]`));
    } else if (typeof v === 'object' && !isLocalized(v) && s && typeof s === 'object') {
      for (const key of Object.keys(s as Record<string, Json>)) walk((v as Record<string, Json>)[key], (s as Record<string, Json>)[key], path ? `${path}.${key}` : key);
    }
  };
  values.forEach((v) => walk(v, sample, ''));
  return [...out];
}

/** An empty value of the sample's type (used for new entries and "Add item"). */
export function blank(sample: Json): Json {
  switch (kindOf(sample)) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'localized':
      return { en: '', ne: '' };
    case 'array':
      return [];
    case 'object':
      return Object.fromEntries(Object.entries(sample as Record<string, Json>).map(([k, v]) => [k, blank(v)]));
    default:
      return null;
  }
}

export const normalizePath = (path: string) => path.replace(/\[\d+\]/g, '[]');

/**
 * Checks `value` against `sample`: same type per field (null only where allowed), no unknown
 * fields, localized values have English text. Returns a list of problems (empty = valid).
 */
export function conform(value: Json, sample: Json, nullable: Set<string>, path = ''): string[] {
  const label = path || 'entry';
  const sk = kindOf(sample);
  const vk = kindOf(value);
  if (vk === 'null') return sk === 'null' || nullable.has(normalizePath(path)) ? [] : [`${label} cannot be empty`];
  if (sk === 'null') return []; // no example to compare with
  if (vk !== sk && !(sk === 'object' && vk === 'localized') && !(sk === 'localized' && vk === 'object')) return [`${label} should be ${sk}, got ${vk}`];
  if (vk === 'localized') {
    const v = value as Record<string, Json>;
    return typeof v.en === 'string' && (v.ne === undefined || v.ne === null || typeof v.ne === 'string') ? [] : [`${label} needs English text`];
  }
  if (vk === 'array') {
    const item = (sample as Json[])[0];
    return item === undefined ? [] : (value as Json[]).flatMap((x, i) => conform(x, item, nullable, `${path}[${i}]`));
  }
  if (vk === 'object') {
    const s = sample as Record<string, Json>;
    return Object.entries(value as Record<string, Json>).flatMap(([k, v]) =>
      k in s ? conform(v, s[k], nullable, path ? `${path}.${k}` : k) : [`${path ? `${path}.` : ''}${k} is not a known field`],
    );
  }
  return [];
}

/** Adds fields present in the sample but missing from the value (null where allowed, else blank). */
export function complete(value: Json, sample: Json, nullable: Set<string>, path = ''): Json {
  if (kindOf(sample) !== 'object' || kindOf(value) !== 'object') {
    if (kindOf(sample) === 'array' && Array.isArray(value)) {
      const item = (sample as Json[])[0];
      return item === undefined ? value : value.map((x, i) => complete(x, item, nullable, `${path}[${i}]`));
    }
    return value;
  }
  const v = { ...(value as Record<string, Json>) };
  for (const [k, s] of Object.entries(sample as Record<string, Json>)) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in v)) v[k] = nullable.has(normalizePath(p)) || s === null ? null : blank(s);
    else v[k] = complete(v[k], s, nullable, p);
  }
  return v;
}

/** "hero_image" → "Hero image" */
export const humanize = (key: string) => key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase());

/** A readable title for an entry or list item. */
export function titleOf(v: Json, fallback = ''): string {
  if (!v || typeof v !== 'object') return typeof v === 'string' ? v : fallback;
  const o = v as Record<string, Json>;
  for (const k of ['name', 'title', 'question', 'label', 'headline', 'level', 'item', 'section', 'city', 'key', 'slug', 'id']) {
    const x = o[k];
    if (typeof x === 'string' && x) return x;
    if (isLocalized(x) && x.en) return x.en;
  }
  return fallback;
}

const SUGGEST = /(^|\.)(kind|scope|topic|group|menu|mode|source|icon|level|type|category|country|countries|city|author|currency|flag|iso2|iso3)(\[\])?$/;

/** Distinct existing values for enum-like text fields (offered as suggestions in the editor). */
export function suggestionsFrom(values: Json[]): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  const walk = (v: Json, path: string) => {
    if (typeof v === 'string') {
      if (v && v.length < 60 && SUGGEST.test(path)) (out[path] ??= new Set()).add(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, `${path}[]`));
    else if (v && typeof v === 'object' && !isLocalized(v)) for (const [k, x] of Object.entries(v as Record<string, Json>)) walk(x, path ? `${path}.${k}` : k);
  };
  values.forEach((v) => walk(v, ''));
  return Object.fromEntries(Object.entries(out).map(([k, set]) => [k, [...set].sort().slice(0, 80)]));
}
