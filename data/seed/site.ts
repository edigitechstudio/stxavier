import type { Accreditation, Office, SiteSettings, Stat } from '@/types/content';

/**
 * Fallback content used when Supabase is not configured, and the source for `npm run seed`.
 * Once seeded, edit this content in Supabase (admin dashboard in Phase 6) — not here.
 * Search for "TODO:" to find every value that still needs real client data.
 */

export const siteSettings: SiteSettings = {
  name: 'St. Xavier Educational Network',
  legal_name: 'St. Xavier Educational Network Pvt. Ltd.',
  tagline: { en: 'One place, many destinations', ne: 'ठाउँ एक, गन्तव्य अनेक' },
  description: {
    en: 'St. Xavier Educational Network is a study abroad consultancy in Kathmandu, Nepal, guiding students since 2012 with counselling, university admissions, IELTS/PTE preparation, scholarships and visa support.',
    ne: 'सेन्ट जेभियर एजुकेशनल नेटवर्क काठमाडौंस्थित विदेश अध्ययन परामर्श संस्था हो, जसले सन् २०१२ देखि परामर्श, विश्वविद्यालय भर्ना, IELTS/PTE तयारी, छात्रवृत्ति र भिसा सहयोग प्रदान गर्दै आएको छ।',
  },
  founded_year: 2012,
  url: 'https://stxavier.com.np',
  phone: '+977-1-5333081',
  whatsapp: '9779845762340',
  email: 'info@stxavier.com.np',
  maps_url: 'https://maps.app.goo.gl/nVHG7DMWoHEQ5cw29',
  social: [
    // TODO: replace with the real profile URLs.
    { platform: 'facebook', url: 'https://www.facebook.com/' },
    { platform: 'instagram', url: 'https://www.instagram.com/' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/' },
    { platform: 'youtube', url: 'https://www.youtube.com/' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/' },
  ],
  // TODO: confirm the intake and deadline the countdown should target.
  next_intake: { label: { en: 'September 2027 intake', ne: 'सेप्टेम्बर २०२७ इन्टेक' }, deadline: '2027-06-30' },
  announcement: {
    en: 'Applications open for 2027 intakes — book a free counselling session',
    ne: '२०२७ इन्टेकका लागि आवेदन खुला — निःशुल्क परामर्श बुक गर्नुहोस्',
  },
  updated_at: '2026-10-15',
};

export const offices: Office[] = [
  {
    id: 'head-office',
    name: { en: 'Head Office', ne: 'प्रधान कार्यालय' },
    is_head_office: true,
    street: { en: 'TODO: street address', ne: 'TODO: ठेगाना' },
    locality: 'Kathmandu',
    region: 'Bagmati',
    postal_code: '44600',
    country_code: 'NP',
    lat: null, // TODO: exact coordinates from the Google Maps pin
    lng: null,
    phone: '+977-1-5333081',
    email: 'info@stxavier.com.np',
    // TODO: confirm office hours.
    hours: [{ days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:30', closes: '18:00' }],
    maps_embed_url: null, // TODO: Google Maps "Embed a map" src URL
    sort: 0,
  },
];

// TODO: every figure below is a placeholder. Replace with verified numbers, then set is_placeholder: false.
export const stats: Stat[] = [
  { key: 'years', value: 14 /* since 2012 */, suffix: '+', label: { en: 'Years of experience', ne: 'वर्षको अनुभव' }, is_placeholder: false, sort: 0 },
  { key: 'visas', value: 5000, suffix: '+', label: { en: 'Visas approved', ne: 'स्वीकृत भिसा' }, is_placeholder: true, sort: 1 },
  { key: 'partners', value: 300, suffix: '+', label: { en: 'Partner universities', ne: 'साझेदार विश्वविद्यालय' }, is_placeholder: true, sort: 2 },
  { key: 'success', value: 95, suffix: '%', label: { en: 'Visa success rate', ne: 'भिसा सफलता दर' }, is_placeholder: true, sort: 3 },
];

// TODO: list only accreditations the consultancy actually holds, with verification links.
export const accreditations: Accreditation[] = [
  { id: 'moest', name: 'Ministry of Education, Science & Technology (MoEST)', logo: null, verify_url: null, is_placeholder: true, sort: 0 },
  { id: 'icef', name: 'ICEF Agency', logo: null, verify_url: null, is_placeholder: true, sort: 1 },
  { id: 'british-council', name: 'British Council Certified Agent', logo: null, verify_url: null, is_placeholder: true, sort: 2 },
];
