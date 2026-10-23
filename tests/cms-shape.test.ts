import { describe, expect, it } from 'vitest';
import { blank, complete, conform, humanize, kindOf, nullablePaths, sampleOf, titleOf } from '@/lib/cms/shape';

const rows = [
  { slug: 'uk', name: { en: 'UK', ne: 'बेलायत' }, badge: null, sort: 1, published: true, facts: [{ label: { en: 'Intakes' }, value: 'Sep' }], tags: ['a'] },
  { slug: 'au', name: { en: 'Australia' }, badge: { en: 'Popular' }, sort: 2, published: false, facts: [], tags: [], hero: { image: '/x.jpg' } },
];

describe('cms shapes', () => {
  it('detects kinds including localized pairs', () => {
    expect(kindOf({ en: 'x' })).toBe('localized');
    expect(kindOf({ en: 'x', ne: null })).toBe('localized');
    expect(kindOf({ en: 'x', other: 1 })).toBe('object');
    expect(kindOf(null)).toBe('null');
  });

  it('merges examples into one sample and knows which fields may be empty', () => {
    const s = sampleOf(rows) as Record<string, unknown>;
    expect(Object.keys(s).sort()).toEqual(['badge', 'facts', 'hero', 'name', 'published', 'slug', 'sort', 'tags']);
    expect(s.badge).toEqual({ en: '', ne: '' });
    expect(s.facts).toEqual([{ label: { en: '', ne: '' }, value: 'Sep' }]);
    expect(nullablePaths(rows)).toContain('badge');
    expect(nullablePaths(rows)).toContain('hero');
  });

  it('builds blank entries', () => {
    expect(blank(sampleOf(rows))).toMatchObject({ slug: '', name: { en: '', ne: '' }, sort: 0, published: false, facts: [], tags: [] });
  });

  it('rejects type changes, unknown fields and missing required values', () => {
    const s = sampleOf(rows);
    const nullable = new Set(nullablePaths(rows));
    expect(conform(rows[0], s, nullable)).toEqual([]);
    expect(conform({ ...rows[0], sort: 'first' }, s, nullable)).toEqual(['sort should be number, got string']);
    expect(conform({ ...rows[0], hacked: true }, s, nullable)).toEqual(['hacked is not a known field']);
    expect(conform({ ...rows[0], name: null }, s, nullable)).toEqual(['name cannot be empty']);
    expect(conform({ ...rows[0], badge: null }, s, nullable)).toEqual([]);
    expect(conform({ ...rows[0], facts: [{ label: 'plain', value: 'x' }] }, s, nullable)).toEqual(['facts[0].label should be localized, got string']);
  });

  it('fills in fields a value is missing', () => {
    const s = sampleOf(rows);
    const nullable = new Set(nullablePaths(rows));
    expect(complete({ slug: 'nz', name: { en: 'NZ' } }, s, nullable)).toMatchObject({ badge: null, hero: null, sort: 0, tags: [] });
  });

  it('labels things for people', () => {
    expect(humanize('hero_image')).toBe('Hero image');
    expect(titleOf(rows[0])).toBe('UK');
    expect(titleOf({ question: { en: 'Why?' } })).toBe('Why?');
  });
});
