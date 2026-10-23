import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { listPosts } from '@/lib/blog';
import { CONTENT_TAGS, getDestinations, getFaqs, getHeadOffice, getNavigation, getPageContent, getServices, getSiteSettings, getTestPrepCourses } from '@/lib/content';
import type { KnowledgeChunk } from '@/types/chat';
import type { Localized } from '@/types/content';
import { buildIndex, type SearchIndex } from './search';

/** Joins localized parts into one Localized value (Nepali falls back to English per part). */
function join(parts: (Localized | string | null | undefined)[], sep = '\n'): Localized {
  const present = parts.filter((p): p is Localized | string => !!p);
  const pick = (p: Localized | string, loc: 'en' | 'ne') => (typeof p === 'string' ? p : ((loc === 'ne' ? p.ne : undefined) ?? p.en));
  return { en: present.map((p) => pick(p, 'en')).join(sep), ne: present.map((p) => pick(p, 'ne')).join(sep) };
}
const t = (en: string, ne?: string): Localized => ({ en, ne: ne ?? en });
const lines = (label: Localized, rows: Localized[]) => join([label, ...rows.map((r) => join(['• ', r], ''))]);

/**
 * Everything the assistant may answer from, chunked by topic. Rebuilt whenever any content
 * table changes (same tags as the pages), so answers always match the website.
 */
export async function getKnowledge(): Promise<KnowledgeChunk[]> {
  'use cache';
  cacheTag(...Object.values(CONTENT_TAGS), 'blog');
  cacheLife('days');

  const [site, office, destinations, faqs, services, courses, booking, nav, posts] = await Promise.all([
    getSiteSettings(),
    getHeadOffice(),
    getDestinations(),
    getFaqs(),
    getServices(),
    getTestPrepCourses(),
    getPageContent('booking'),
    getNavigation('header'),
    listPosts('en'),
  ]);
  const chunks: KnowledgeChunk[] = [];
  const add = (c: KnowledgeChunk) => chunks.push(c);

  // ---- About & contact ---------------------------------------------------------------------
  const address = office ? join([office.street, t(`${office.locality}, Nepal`, `${office.locality}, नेपाल`)], ', ') : t('Kathmandu, Nepal');
  const hours = office?.hours.map((h) => `${h.days[0]}–${h.days[h.days.length - 1]} ${h.opens}–${h.closes}`).join('; ');
  add({
    id: 'contact',
    path: '/contact',
    title: t('Contact St. Xavier Educational Network', 'सेन्ट जेभियर एजुकेशनल नेटवर्कसँग सम्पर्क'),
    text: join([
      site.description,
      join([t('Office: ', 'कार्यालय: '), address], ''),
      t(`Phone: ${site.phone}. WhatsApp: +${site.whatsapp}. Email: ${site.email}.`, `फोन: ${site.phone}। WhatsApp: +${site.whatsapp}। इमेल: ${site.email}।`),
      hours ? t(`Opening hours: ${hours}.`, `खुल्ने समय: ${hours}।`) : null,
      t(`Founded in ${site.founded_year}.`, `स्थापना ${site.founded_year}।`),
    ]),
    keywords: 'address location office hours open phone number call email whatsapp where kathmandu contact founded about',
  });

  add({
    id: 'booking',
    path: '/book',
    title: t('Book a free counselling session', 'निःशुल्क परामर्श सत्र बुक गर्नुहोस्'),
    text: join([
      t(
        `Counselling is free. Book online at /book: choose a counsellor (or any available), then an office visit, Zoom video call or WhatsApp call, then a time. Bookings open from ${Math.round(booking.min_notice_minutes / 60)} hours ahead up to ${booking.horizon_days} days ahead. You get a reference number and confirmation email.`,
        `परामर्श निःशुल्क छ। /book मा अनलाइन बुक गर्नुहोस्: परामर्शदाता, त्यसपछि कार्यालय भेट, Zoom वा WhatsApp कल, अनि समय छान्नुहोस्।`,
      ),
      booking.office_address,
      booking.zoom_note,
      booking.whatsapp_note,
    ]),
    keywords: 'appointment meeting counsellor counselor consultation free session zoom whatsapp office visit schedule',
  });

  // ---- Destinations ----------------------------------------------------------------------------
  for (const d of destinations) {
    const p = `/study-in/${d.slug}`;
    const name = d.name;
    const kw = `${d.name.en} ${d.slug} ${d.iso2} ${d.iso3}`;
    const f = d.key_facts;
    add({
      id: `${d.slug}-overview`,
      path: p,
      title: join([t('Study in ', 'अध्ययन: '), name], ''),
      text: join([
        d.details?.intro ?? d.summary,
        f.intakes && join([t('Intakes: ', 'इनटेक: '), f.intakes], ''),
        f.avg_tuition && join([t('Average tuition: ', 'औसत शुल्क: '), f.avg_tuition], ''),
        f.living_cost && join([t('Living cost: ', 'बस्ने खर्च: '), f.living_cost], ''),
        f.work_rights && join([t('Work rights: ', 'काम गर्ने अधिकार: '), f.work_rights], ''),
        f.post_study_visa && join([t('Post-study work visa: ', 'अध्ययनपछि काम भिसा: '), f.post_study_visa], ''),
        f.visa_processing && join([t('Visa processing time: ', 'भिसा प्रक्रिया समय: '), f.visa_processing], ''),
        f.pr_pathway && join([t('PR pathway: ', 'PR बाटो: '), f.pr_pathway], ''),
        ...(d.details?.why ?? []).map((w) => join([w.title, w.text], ': ')),
      ]),
      keywords: `${kw} intake overview why`,
    });
    const det = d.details;
    if (!det) continue;
    add({
      id: `${d.slug}-cost`,
      path: p,
      title: join([t('Cost of studying in ', 'अध्ययन खर्च: '), name], ''),
      text: join([
        det.costs.answer,
        lines(t('Tuition:', 'शुल्क:'), det.costs.tuition.map((r) => join([r.level, r.range], ': '))),
        lines(t('Living costs:', 'बस्ने खर्च:'), det.costs.living.map((r) => join([r.item, r.amount], ': '))),
        det.costs.note,
      ]),
      keywords: `${kw} cost fee tuition living expense budget money funds bank balance`,
    });
    add({
      id: `${d.slug}-visa`,
      path: p,
      title: join([name, t(' student visa from Nepal', ' विद्यार्थी भिसा')], ''),
      text: join([det.visa.answer, ...det.visa.steps.map((s, i) => join([`${i + 1}. `, s.title, t(': '), s.text], '')), det.visa.total_time ? t(`Typical total time: ${det.visa.total_time}`) : null]),
      keywords: `${kw} visa apply application process steps embassy biometrics interview`,
    });
    add({
      id: `${d.slug}-documents`,
      path: p,
      title: join([t('Documents needed for ', 'आवश्यक कागजात: '), name], ''),
      text: lines(t('Documents:', 'कागजात:'), det.documents),
      keywords: `${kw} documents paper checklist requirement passport transcript`,
    });
    add({
      id: `${d.slug}-work`,
      path: p,
      title: join([t('Working while studying in ', 'पढ्दै काम: '), name], ''),
      text: join([det.work, det.life.nepali_community ? join([t('Nepali community: ', 'नेपाली समुदाय: '), det.life.nepali_community], '') : null, join([t(`Life in ${det.life.city}: `), det.life.text], '')]),
      keywords: `${kw} work job part-time hours life city community nepali`,
    });
    if (det.scholarships.length || det.universities.length || det.courses.length) {
      add({
        id: `${d.slug}-unis`,
        path: p,
        title: join([t('Universities, courses and scholarships in ', 'विश्वविद्यालय, कोर्स र छात्रवृत्ति: '), name], ''),
        text: join([
          det.universities.length ? t(`Popular universities: ${det.universities.map((u) => `${u.name} (${u.city})`).join(', ')}.`) : null,
          det.courses.length ? lines(t('Popular courses:', 'लोकप्रिय कोर्स:'), det.courses) : null,
          det.scholarships.length ? lines(t('Scholarships:', 'छात्रवृत्ति:'), det.scholarships.map((s) => join([s.name, s.detail], ': '))) : null,
        ]),
        keywords: `${kw} university universities college course program scholarship funding`,
      });
    }
  }

  // ---- FAQs ------------------------------------------------------------------------------
  for (const f of faqs) {
    const scope = f.scope.startsWith('destination:') ? `/study-in/${f.scope.split(':')[1]}` : f.scope.startsWith('tool:') ? '/tools' : '/faq';
    add({ id: `faq-${f.id}`, path: scope, title: f.question, text: f.answer });
  }

  // ---- Services & test prep --------------------------------------------------------------------
  for (const s of services) {
    add({
      id: `service-${s.slug}`,
      path: `/services/${s.slug}`,
      title: s.title,
      text: join([s.summary, s.details?.intro, ...(s.details?.points ?? []).map((p) => join([p.title, p.text], ': '))]),
      keywords: 'service help support',
    });
  }
  for (const c of courses) {
    const det = c.details;
    add({
      id: `course-${c.slug}`,
      path: `/test-prep/${c.slug}`,
      title: join([c.name, t(' classes at St. Xavier', ' कक्षा')], ''),
      text: join([
        c.summary,
        det?.overview,
        det ? join([t('Duration: ', 'अवधि: '), det.duration], '') : null,
        det?.fee ? join([t('Fee: ', 'शुल्क: '), det.fee], '') : null,
        det ? t(`Mode: ${det.mode}.`) : null,
        ...(det?.batches ?? []).map((b) => join([t('Batch: '), b.name, t(` ${b.time} `), b.days], '')),
        ...(det?.features ?? []),
      ]),
      keywords: `${c.slug} class course preparation coaching batch time schedule fee test exam`,
    });
  }

  // ---- Tools & guides ----------------------------------------------------------------------------
  const tools = nav.find((n) => n.id === 'tools')?.children ?? [];
  if (tools.length) {
    add({
      id: 'tools',
      path: '/tools',
      title: t('Free study abroad tools', 'निःशुल्क उपकरणहरू'),
      text: lines(t('Free online tools:', 'निःशुल्क अनलाइन उपकरण:'), tools.map((x) => join([x.label, t(` (${x.href})`)], ''))),
      keywords: 'calculator tool estimate checker converter gpa ielts band emi loan eligibility scholarship finder checklist compare timeline',
    });
  }
  for (const post of posts) {
    add({ id: `blog-${post.slug}`, path: `/blog/${post.slug}`, title: t(post.title), text: t(post.description), keywords: `${post.topic} ${(post.countries ?? []).join(' ')} guide article` });
  }

  // Editorial notes ("TODO: verify … with IRCC") are for the team, never for visitors.
  return chunks.map((c) => ({ ...c, text: { en: stripNotes(c.text.en), ne: c.text.ne ? stripNotes(c.text.ne) : c.text.ne } }));
}

/** Removes "TODO: …" sentences/lines (English or Nepali punctuation) from text given to the assistant. */
export function stripNotes(text: string) {
  return text
    .replace(/\s*TODO:[^\n.।]*[.।]?/g, '')
    .replace(/^\s*•\s*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** FNV-1a, to notice when the cached content changed. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** The search index is rebuilt only when the content changes (cached reads return fresh copies). */
let memo: { key: number; index: SearchIndex } | null = null;
export async function getSearchIndex(): Promise<SearchIndex> {
  const chunks = await getKnowledge();
  const key = hash(JSON.stringify(chunks));
  if (memo?.key !== key) memo = { key, index: buildIndex(chunks) };
  return memo.index;
}
