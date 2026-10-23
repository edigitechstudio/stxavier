import { describe, expect, it } from 'vitest';
import * as seed from '@/data/seed';

/** Guards the seed data that ships as the no-database fallback. */
describe('seed content integrity', () => {
  it('has unique slugs/ids per collection', () => {
    const unique = (xs: string[]) => new Set(xs).size === xs.length;
    expect(unique(seed.destinations.map((d) => d.slug))).toBe(true);
    expect(unique(seed.services.map((s) => s.slug))).toBe(true);
    expect(unique(seed.navItems.map((n) => n.id))).toBe(true);
    expect(unique(seed.faqs.map((f) => f.id))).toBe(true);
  });

  it('every nav child points at an existing parent', () => {
    const ids = new Set(seed.navItems.map((n) => n.id));
    for (const n of seed.navItems) if (n.parent_id) expect(ids.has(n.parent_id)).toBe(true);
  });

  it('every destination has a valid ISO3 code and coordinates', () => {
    for (const d of seed.destinations) {
      expect(d.iso3).toMatch(/^[A-Z]{3}$/);
      expect(Math.abs(d.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(d.lng)).toBeLessThanOrEqual(180);
    }
  });

  it('has exactly one head office', () => {
    expect(seed.offices.filter((o) => o.is_head_office)).toHaveLength(1);
  });
});
