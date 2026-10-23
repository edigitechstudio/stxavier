import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import {
  CONTENT_TAGS,
  getDestinations,
  getFaqs,
  getHeadOffice,
  getServices,
  getSiteSettings,
  getTestPrepCourses,
} from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { listPosts } from '@/lib/blog';
import { absoluteUrl } from './urls';

/**
 * Builds /llms.txt (summary + key links) and /llms-full.txt (adds key facts and FAQs) from live
 * content, so AI assistants always see the same facts as the website.
 */
export async function buildLlmsTxt(full: boolean): Promise<string> {
  'use cache';
  cacheLife('days');
  cacheTag(...Object.values(CONTENT_TAGS));

  const [site, office, destinations, services, courses, faqs, posts] = await Promise.all([
    getSiteSettings(),
    getHeadOffice(),
    getDestinations(),
    getServices(),
    getTestPrepCourses(),
    getFaqs(),
    listPosts('en'),
  ]);
  const u = (path: string) => absoluteUrl('en', path);
  const lines: string[] = [];

  lines.push(`# ${site.name}`, '', `> ${l(site.description, 'en')}`, '');
  lines.push(
    `- Founded: ${site.founded_year}`,
    `- Location: ${office ? `${l(office.street, 'en')}, ${office.locality}, Nepal` : 'Kathmandu, Nepal'}`,
    `- Phone: ${site.phone}`,
    `- WhatsApp: +${site.whatsapp}`,
    `- Email: ${site.email}`,
    `- Website: ${site.url} (English: /en, Nepali: /ne)`,
    `- Tagline: ${site.tagline.ne} (“${site.tagline.en}”)`,
    '',
  );

  lines.push('## Study destinations', '');
  for (const d of destinations) lines.push(`- [Study in ${l(d.name, 'en')}](${u(`/study-in/${d.slug}`)}): ${l(d.summary, 'en')}`);
  lines.push('', '## Services', '');
  for (const s of services) lines.push(`- [${l(s.title, 'en')}](${u(`/services/${s.slug}`)}): ${l(s.summary, 'en')}`);
  lines.push('', '## Test preparation classes', '');
  for (const c of courses) lines.push(`- [${l(c.name, 'en')}](${u(`/test-prep/${c.slug}`)}): ${l(c.summary, 'en')}`);
  lines.push('', '## Key pages', '');
  lines.push(
    `- [About St. Xavier Educational Network](${u('/about')})`,
    `- [Our counsellors](${u('/team')})`,
    `- [Study destinations compared](${u('/destinations')})`,
    `- [Guide for parents](${u('/for-parents')})`,
    `- [Free study abroad tools](${u('/tools')})`,
    `- [Contact & office location](${u('/contact')})`,
    `- [Frequently asked questions](${u('/faq')})`,
    `- [University directory](${u('/universities')})`,
    `- [Student success stories](${u('/success-stories')})`,
    `- [Events and webinars](${u('/events')})`,
  );
  if (posts.length) {
    lines.push('', '## Guides', '');
    for (const p of posts) lines.push(`- [${p.title}](${u(`/blog/${p.slug}`)}): ${p.description}`);
  }

  if (full) {
    lines.push('', '## Destination key facts', '');
    for (const d of destinations) {
      const f = d.key_facts;
      const facts = [
        ['Intakes', f.intakes],
        ['Average tuition', f.avg_tuition],
        ['Living cost', f.living_cost],
        ['Work rights', f.work_rights],
        ['Post-study visa', f.post_study_visa],
        ['Visa processing', f.visa_processing],
      ].filter(([, v]) => v) as [string, { en: string }][];
      lines.push(`### Study in ${l(d.name, 'en')} from Nepal (last updated ${d.updated_at})`);
      if (d.details) lines.push(l(d.details.intro, 'en') ?? '', '', `Cost: ${l(d.details.costs.answer, 'en')}`, '', `Visa: ${l(d.details.visa.answer, 'en')}`, '', `Work: ${l(d.details.work, 'en')}`, '');
      for (const [k, v] of facts) lines.push(`- ${k}: ${v.en}`);
      if (d.details?.sources.length) lines.push(...d.details.sources.map((src) => `- Source: [${src.label}](${src.url})`));
      lines.push('');
    }
    if (faqs.length) {
      lines.push('## FAQs', '');
      for (const f of faqs) lines.push(`### ${l(f.question, 'en')}`, l(f.answer, 'en') ?? '', '');
    }
  }

  lines.push('', `_Last updated: ${site.updated_at}_`, '');
  return lines.join('\n');
}
