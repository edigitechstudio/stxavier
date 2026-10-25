import type { Localized } from '@/types/content';
import type { SiteEvent, University } from '@/types/trust';

const L = (en: string, ne?: string): Localized => (ne ? { en, ne } : { en });
const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const UPDATED = '2026-10-16';

// ---------------------------------------------------------------------------
// University directory
// TODO: add logos, verify fee ranges per university, add rankings with their source
// (e.g. "QS 2026") and mark confirmed partners with is_partner: true. No partnership or
// ranking is claimed until those fields are filled in.
// ---------------------------------------------------------------------------

type Uni = [slug: string, name: string, country: string, city: string, fees: [number, number] | null, fields: string[], courses: string[]];

const CURRENCY: Record<string, string> = { uk: 'GBP', australia: 'AUD', canada: 'CAD', usa: 'USD', 'new-zealand': 'NZD', cyprus: 'EUR', japan: 'JPY' };
const INTAKES: Record<string, number[]> = { uk: [1, 9], australia: [2, 7], canada: [1, 5, 9], usa: [1, 8], 'new-zealand': [2, 7], cyprus: [2, 9], japan: [4, 10] };
const COUNTRY_NAME: Record<string, string> = { uk: 'the UK', australia: 'Australia', canada: 'Canada', usa: 'the USA', 'new-zealand': 'New Zealand', cyprus: 'Cyprus', japan: 'Japan' };

const unis: Uni[] = [
  ['university-of-leeds', 'University of Leeds', 'uk', 'Leeds', [24000, 36000], ['business', 'engineering', 'data', 'health'], ['MSc Business Analytics', 'MSc Computer Science', 'MA International Business']],
  ['coventry-university', 'Coventry University', 'uk', 'Coventry', [17000, 22000], ['business', 'engineering', 'it', 'health'], ['MSc Data Science', 'MBA Global', 'BSc Nursing']],
  ['university-of-greenwich', 'University of Greenwich', 'uk', 'London', [16000, 19000], ['business', 'it', 'hospitality'], ['MSc Computer Science', 'MBA', 'BA Hospitality Management']],
  ['university-of-hertfordshire', 'University of Hertfordshire', 'uk', 'Hatfield', [16000, 19000], ['business', 'engineering', 'health'], ['MSc Cyber Security', 'MSc Project Management']],
  ['university-of-east-anglia', 'University of East Anglia', 'uk', 'Norwich', [20000, 28000], ['business', 'arts', 'health'], ['MSc Accounting & Finance', 'MSc Advanced Computing Science']],
  ['monash-university', 'Monash University', 'australia', 'Melbourne', [38000, 52000], ['engineering', 'health', 'business', 'it'], ['Master of IT', 'Master of Nursing Practice', 'Master of Business']],
  ['rmit-university', 'RMIT University', 'australia', 'Melbourne', [33000, 45000], ['it', 'engineering', 'arts', 'business'], ['Master of Data Science', 'Master of Engineering', 'Bachelor of IT']],
  ['deakin-university', 'Deakin University', 'australia', 'Geelong / Melbourne', [30000, 42000], ['health', 'it', 'business'], ['Master of Nursing Practice', 'Master of IT', 'MBA']],
  ['macquarie-university', 'Macquarie University', 'australia', 'Sydney', [34000, 46000], ['business', 'it', 'data'], ['Master of Applied Finance', 'Master of IT']],
  ['western-sydney-university', 'Western Sydney University', 'australia', 'Sydney', [30000, 38000], ['health', 'it', 'business'], ['Master of Nursing', 'Master of Information & Communications Technology']],
  ['university-of-toronto', 'University of Toronto', 'canada', 'Toronto', [45000, 65000], ['engineering', 'data', 'business', 'health'], ['MEng', 'MSc Applied Computing', 'BCom']],
  ['humber-polytechnic', 'Humber Polytechnic', 'canada', 'Toronto', [17000, 20000], ['business', 'it', 'hospitality'], ['PG Certificate Project Management', 'Diploma Computer Programming']],
  ['conestoga-college', 'Conestoga College', 'canada', 'Kitchener', [16000, 19000], ['business', 'engineering', 'health'], ['PG Certificate Supply Chain', 'Diploma Mechanical Engineering Technology']],
  ['university-of-windsor', 'University of Windsor', 'canada', 'Windsor', [24000, 32000], ['engineering', 'it', 'business'], ['MEng Electrical', 'MAC Applied Computing']],
  ['thompson-rivers-university', 'Thompson Rivers University', 'canada', 'Kamloops', [20000, 26000], ['business', 'it', 'hospitality'], ['PB Diploma Data Science', 'MBA']],
  ['arizona-state-university', 'Arizona State University', 'usa', 'Tempe, AZ', [33000, 42000], ['engineering', 'it', 'business', 'data'], ['MS Computer Science', 'MS Information Technology', 'BS Business']],
  ['ut-arlington', 'University of Texas at Arlington', 'usa', 'Arlington, TX', [28000, 34000], ['engineering', 'it', 'data'], ['MS Computer Science', 'MS Engineering Management']],
  ['southeast-missouri-state', 'Southeast Missouri State University', 'usa', 'Cape Girardeau, MO', [15000, 18000], ['it', 'business'], ['MS Computer Science', 'MBA']],
  ['university-of-central-missouri', 'University of Central Missouri', 'usa', 'Warrensburg, MO', [16000, 20000], ['it', 'data', 'business'], ['MS Computer Science', 'MS Big Data Analytics']],
  ['northeastern-university', 'Northeastern University', 'usa', 'Boston, MA', [45000, 60000], ['it', 'data', 'engineering', 'business'], ['MS Data Analytics Engineering', 'MS Information Systems']],
  ['university-of-auckland', 'University of Auckland', 'new-zealand', 'Auckland', [38000, 50000], ['engineering', 'business', 'health'], ['Master of Engineering Studies', 'Master of Business Analytics']],
  ['aut', 'Auckland University of Technology', 'new-zealand', 'Auckland', [32000, 42000], ['it', 'business', 'health'], ['Master of Computer & Information Sciences', 'PG Diploma Business']],
  ['university-of-canterbury', 'University of Canterbury', 'new-zealand', 'Christchurch', [33000, 45000], ['engineering', 'it', 'data'], ['Master of Engineering', 'Master of Applied Data Science']],
  ['massey-university', 'Massey University', 'new-zealand', 'Palmerston North', [30000, 40000], ['health', 'business', 'it'], ['Master of Information Sciences', 'Master of Analytics']],
  ['university-of-waikato', 'University of Waikato', 'new-zealand', 'Hamilton', [30000, 40000], ['it', 'business', 'engineering'], ['Master of Cyber Security', 'Master of Business Analytics']],
  ['university-of-nicosia', 'University of Nicosia', 'cyprus', 'Nicosia', [8000, 12000], ['business', 'health', 'it'], ['MBA', 'BSc Computer Science', 'BSc Nursing']],
  ['european-university-cyprus', 'European University Cyprus', 'cyprus', 'Nicosia', [8000, 11000], ['business', 'health', 'hospitality'], ['BBA', 'MSc Hospitality Management']],
  ['frederick-university', 'Frederick University', 'cyprus', 'Nicosia / Limassol', [7000, 10000], ['engineering', 'business', 'arts'], ['BSc Civil Engineering', 'MBA']],
  ['ritsumeikan-apu', 'Ritsumeikan Asia Pacific University', 'japan', 'Beppu', [1300000, 1500000], ['business', 'hospitality'], ['BA Asia Pacific Studies', 'BBA International Management']],
  ['waseda-university', 'Waseda University', 'japan', 'Tokyo', [1200000, 1700000], ['business', 'engineering', 'arts'], ['School of International Liberal Studies', 'Graduate School of Commerce']],
];

export const universities: University[] = unis.map(([slug, name, country, city, fees, fields, courses], i) => ({
  slug,
  name,
  country,
  city,
  logo: null,
  image: null,
  ranking: null,
  ranking_source: null,
  fee_min: fees?.[0] ?? null,
  fee_max: fees?.[1] ?? null,
  currency: CURRENCY[country],
  intakes: INTAKES[country],
  fields,
  popular_courses: courses.map((c) => L(c)),
  description: L(`${name} in ${city} is a popular choice for Nepali students heading to ${COUNTRY_NAME[country]}. Ask a St. Xavier counsellor about entry requirements, scholarships and intakes for your course.`),
  website: null,
  is_partner: false,
  is_placeholder: false,
  sort: i,
  published: true,
  updated_at: UPDATED,
}));

// ---------------------------------------------------------------------------
// Events & webinars (TODO: replace samples with the real calendar; samples never render in production)
// ---------------------------------------------------------------------------

export const events: SiteEvent[] = [
  {
    slug: 'uk-university-fair-nov-2026', kind: 'university_visit', is_placeholder: true, published: true,
    title: L('UK University Fair, Kathmandu', 'बेलायत विश्वविद्यालय मेला, काठमाडौं'),
    summary: L('Meet UK university representatives, get on-the-spot profile assessments and learn about January and September intakes.'),
    description: [L('Bring your transcripts and English test results for an on-the-spot profile assessment.'), L('Entry is free, but registration is required as seats are limited.')],
    starts_at: '2026-11-14T11:00:00+05:45', ends_at: '2026-11-14T16:00:00+05:45',
    venue: L('St. Xavier Educational Network, Kathmandu'), online_url: null, recording_url: null,
    image: unsplash('1524178232363-1fb2b075b655'), capacity: 150, countries: ['uk'],
  },
  {
    slug: 'australia-webinar-nov-2026', kind: 'webinar', is_placeholder: true, published: true,
    title: L('Webinar: Studying in Australia in 2027', 'वेबिनार: २०२७ मा अष्ट्रेलियामा अध्ययन'),
    summary: L('Genuine Student requirements, costs, part-time work and post-study visas. Live Q&A with our Australia counsellor.'),
    description: [L('A 45-minute session followed by live questions.'), L('The joining link is sent after registration.')],
    starts_at: '2026-11-28T18:00:00+05:45', ends_at: '2026-11-28T19:00:00+05:45',
    venue: null, online_url: 'https://zoom.us/', recording_url: null,
    image: unsplash('1506973035872-a4ec16b8e8d9'), capacity: 300, countries: ['australia'],
  },
  {
    slug: 'japan-info-session-dec-2026', kind: 'event', is_placeholder: true, published: true,
    title: L('Japan Language School Info Session', 'जापान भाषा विद्यालय जानकारी सत्र'),
    summary: L('April and October intakes, Certificate of Eligibility documents and JLPT preparation.'),
    description: [L('Ideal for students planning the April 2027 or October 2027 intake.')],
    starts_at: '2026-12-12T14:00:00+05:45', ends_at: '2026-12-12T15:30:00+05:45',
    venue: L('St. Xavier Educational Network, Kathmandu'), online_url: null, recording_url: null,
    image: unsplash('1540959733332-eab4deabeeaf'), capacity: 60, countries: ['japan'],
  },
  {
    slug: 'canada-webinar-sep-2026', kind: 'webinar', is_placeholder: true, published: true,
    title: L('Webinar: Canada study permits explained', 'वेबिनार: क्यानडा स्टडी परमिट'),
    summary: L('Provincial attestation letters, proof of funds and choosing between colleges and universities.'),
    description: [L('Watch the recording of this session.')],
    starts_at: '2026-09-20T18:00:00+05:45', ends_at: '2026-09-20T19:00:00+05:45',
    venue: null, online_url: null, recording_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    image: unsplash('1517935706615-2717063c2225'), capacity: null, countries: ['canada'],
  },
];

// Success-wall extras merged into the sample stories (TODO: real stories with written consent).
export const storyExtras: Record<string, { destination: string; university: string; intake: string; story: Localized; video_url?: string }> = {
  'story-1': { destination: 'australia', university: 'University of Melbourne', intake: 'Feb 2026', story: L('I had a two-year gap after +2 and was worried it would count against me. My counsellor helped me explain it honestly in my statement, chose universities that value work experience, and prepared me for the Genuine Student questions. I received my offer in five weeks and my visa three weeks later.'), video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  'story-2': { destination: 'canada', university: 'University of Toronto', intake: 'Sep 2025', story: L('The mock interviews were tougher than the real thing. By the time I sat my visa interview, I could explain my study plan and finances confidently. The team also helped me plan my first month in Toronto.') },
  'story-3': { destination: 'uk', university: 'University of Leeds', intake: 'Sep 2025', story: L('I went from IELTS 6.0 to 7.5 in two months with the evening batch. The writing feedback was detailed and the speaking practice made me far more fluent.'), video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  'story-4': { destination: 'usa', university: 'Arizona State University', intake: 'Aug 2025', story: L('My counsellor found a merit scholarship I did not know about, which reduced my tuition significantly and made studying in the USA possible for my family.') },
  'story-5': { destination: 'japan', university: 'Japanese Language School, Tokyo', intake: 'Apr 2026', story: L('The Japanese classes prepared me for daily life in Tokyo, not just the exam, and the team guided my family through every COE document.') },
};
