import type { Localized } from '@/types/content';
import type {
  CostProfile,
  EnglishRequirement,
  GradingScale,
  Requirements,
  Scholarship,
  TimelineStep,
  ToolContent,
  ToolsConfig,
} from '@/types/tools';

/**
 * Data behind the free tools. Everything here is editable in Supabase after seeding.
 *
 * TODO: all money figures, score thresholds and visa rules are planning estimates aligned with
 * the country pages. Re-verify against official sources before launch and after any rule change.
 */

const L = (en: string, ne?: string): Localized => (ne ? { en, ne } : { en });

// ---------------------------------------------------------------------------
// Per-destination tool inputs
// ---------------------------------------------------------------------------

export const costProfiles: Record<string, CostProfile> = {
  uk: {
    currency: 'GBP',
    tuition: { ug: [11000, 38000], pg: [12000, 35000] },
    living_monthly: { major: 1450, mid: 1100, small: 950 },
    extras_yearly: [{ label: L('Immigration Health Surcharge', 'स्वास्थ्य सरचार्ज'), amount: 776 }],
    one_off: [{ label: L('Student visa fee', 'विद्यार्थी भिसा शुल्क'), amount: 524 }],
    default_years: { ug: 3, pg: 1 },
    cities: { major: 'London', mid: 'Manchester', small: 'Norwich' },
  },
  australia: {
    currency: 'AUD',
    tuition: { diploma: [8000, 22000], ug: [20000, 45000], pg: [22000, 50000] },
    living_monthly: { major: 2200, mid: 1900, small: 1700 },
    extras_yearly: [{ label: L('Overseas Student Health Cover (OSHC)'), amount: 700 }],
    one_off: [{ label: L('Student visa charge', 'विद्यार्थी भिसा शुल्क'), amount: 2000 }],
    default_years: { diploma: 1, ug: 3, pg: 2 },
    cities: { major: 'Sydney', mid: 'Adelaide', small: 'Hobart' },
  },
  canada: {
    currency: 'CAD',
    tuition: { diploma: [15000, 22000], ug: [20000, 40000], pg: [18000, 35000] },
    living_monthly: { major: 1900, mid: 1500, small: 1300 },
    extras_yearly: [{ label: L('Health insurance', 'स्वास्थ्य बीमा'), amount: 700 }],
    one_off: [{ label: L('Study permit + biometrics', 'स्टडी परमिट + बायोमेट्रिक्स'), amount: 235 }],
    default_years: { diploma: 2, ug: 4, pg: 2 },
    cities: { major: 'Toronto', mid: 'Ottawa', small: 'Kamloops' },
  },
  usa: {
    currency: 'USD',
    tuition: { diploma: [8000, 15000], ug: [20000, 50000], pg: [20000, 45000] },
    living_monthly: { major: 2000, mid: 1400, small: 1100 },
    extras_yearly: [{ label: L('Health insurance', 'स्वास्थ्य बीमा'), amount: 2000 }],
    one_off: [{ label: L('SEVIS + visa application fee', 'SEVIS + भिसा शुल्क'), amount: 535 }],
    default_years: { diploma: 2, ug: 4, pg: 2 },
    cities: { major: 'New York', mid: 'Dallas', small: 'Springfield' },
  },
  'new-zealand': {
    currency: 'NZD',
    tuition: { diploma: [18000, 25000], ug: [22000, 35000], pg: [26000, 45000] },
    living_monthly: { major: 1800, mid: 1500, small: 1300 },
    extras_yearly: [{ label: L('Insurance', 'बीमा'), amount: 600 }],
    one_off: [{ label: L('Student visa fee', 'विद्यार्थी भिसा शुल्क'), amount: 750 }],
    default_years: { diploma: 1, ug: 3, pg: 1 },
    cities: { major: 'Auckland', mid: 'Christchurch', small: 'Palmerston North' },
  },
  cyprus: {
    currency: 'EUR',
    tuition: { ug: [3500, 10000], pg: [5000, 12000] },
    living_monthly: { major: 900, mid: 750, small: 650 },
    extras_yearly: [{ label: L('Health insurance', 'स्वास्थ्य बीमा'), amount: 300 }],
    one_off: [{ label: L('Entry & residence permit', 'प्रवेश र बसोबास अनुमति'), amount: 200 }],
    default_years: { ug: 4, pg: 2 },
    cities: { major: 'Limassol', mid: 'Nicosia', small: 'Larnaca' },
  },
  japan: {
    currency: 'JPY',
    tuition: { language: [700000, 900000], diploma: [700000, 1000000], ug: [535800, 1500000], pg: [535800, 1200000] },
    living_monthly: { major: 120000, mid: 95000, small: 80000 },
    extras_yearly: [{ label: L('National health insurance', 'राष्ट्रिय स्वास्थ्य बीमा'), amount: 24000 }],
    one_off: [{ label: L('Admission / selection fees', 'भर्ना शुल्क'), amount: 50000 }],
    default_years: { language: 2, diploma: 2, ug: 4, pg: 2 },
    cities: { major: 'Tokyo', mid: 'Osaka', small: 'Fukuoka' },
  },
};

export const requirements: Record<string, Requirements> = {
  uk: { min_budget_npr: { ug: 4_500_000, pg: 4_500_000 }, ielts: { ug: 6, pg: 6.5 }, min_percent: { ug: 60, pg: 55 }, strong_fields: ['business', 'data', 'arts', 'health'] },
  australia: { min_budget_npr: { diploma: 3_000_000, ug: 4_300_000, pg: 4_500_000 }, ielts: { diploma: 5.5, ug: 6, pg: 6.5 }, min_percent: { diploma: 50, ug: 60, pg: 55 }, strong_fields: ['health', 'it', 'business', 'hospitality'] },
  canada: { min_budget_npr: { diploma: 3_300_000, ug: 4_300_000, pg: 3_900_000 }, ielts: { diploma: 6, ug: 6.5, pg: 6.5 }, min_percent: { diploma: 55, ug: 65, pg: 60 }, strong_fields: ['it', 'business', 'engineering', 'health'] },
  usa: { min_budget_npr: { diploma: 3_500_000, ug: 5_000_000, pg: 5_000_000 }, ielts: { diploma: 5.5, ug: 6, pg: 6.5 }, min_percent: { diploma: 50, ug: 60, pg: 60 }, strong_fields: ['it', 'data', 'engineering', 'business'] },
  'new-zealand': { min_budget_npr: { diploma: 3_000_000, ug: 3_400_000, pg: 3_800_000 }, ielts: { diploma: 5.5, ug: 6, pg: 6.5 }, min_percent: { diploma: 50, ug: 60, pg: 55 }, strong_fields: ['it', 'health', 'engineering'] },
  cyprus: { min_budget_npr: { ug: 2_000_000, pg: 2_400_000 }, ielts: { ug: 5.5, pg: 6 }, min_percent: { ug: 50, pg: 50 }, strong_fields: ['business', 'hospitality', 'health'] },
  japan: { min_budget_npr: { language: 1_600_000, diploma: 1_700_000, ug: 1_600_000, pg: 1_600_000 }, ielts: { language: null, diploma: null, ug: null, pg: null }, min_percent: { language: 50, diploma: 50, ug: 60, pg: 60 }, strong_fields: ['it', 'hospitality', 'engineering'] },
};

const step = (key: string, weeks: number, en: string, ne: string, detailEn: string): TimelineStep => ({
  key,
  weeks_before: weeks,
  label: L(en, ne),
  detail: L(detailEn),
});

const englishRoute: TimelineStep[] = [
  step('counselling', 48, 'Free counselling & shortlist', 'निःशुल्क परामर्श र सर्टलिस्ट', 'Agree on countries, courses and budget with your counsellor.'),
  step('test', 40, 'Take IELTS / PTE', 'IELTS / PTE परीक्षा', 'Book the test early so results arrive before application deadlines.'),
  step('apply', 32, 'Submit applications', 'आवेदन पेश', 'Apply with transcripts, SOP, LORs and test scores.'),
  step('offer', 24, 'Receive offers & choose', 'अफर प्राप्त र छनोट', 'Compare offers, scholarships and conditions.'),
  step('deposit', 16, 'Pay deposit & get CAS/CoE/I-20', 'डिपोजिट र CAS/CoE/I-20', 'Secure your enrolment document from the institution.'),
  step('funds', 14, 'Finalise funds & NOC', 'आर्थिक कागजात र NOC', 'Prepare bank documents and get the NOC from the Ministry of Education.'),
  step('visa', 10, 'Lodge visa application', 'भिसा आवेदन', 'Apply online, give biometrics and attend any interview.'),
  step('travel', 2, 'Book flight & pre-departure', 'उडान र प्रस्थान-पूर्व तयारी', 'Book flights, accommodation and attend the pre-departure briefing.'),
];

export const timelines: Record<string, TimelineStep[]> = {
  uk: englishRoute,
  australia: englishRoute,
  canada: englishRoute.map((s) => (s.key === 'visa' ? { ...s, weeks_before: 12 } : s)),
  usa: englishRoute.map((s) => (s.key === 'visa' ? { ...s, weeks_before: 12, detail: L('Pay SEVIS, complete DS-160 and attend the embassy interview.') } : s)),
  'new-zealand': englishRoute,
  cyprus: englishRoute.map((s) => (s.key === 'visa' ? { ...s, weeks_before: 12, detail: L('The university applies for your entry permit; then obtain your visa.') } : s)),
  japan: [
    step('counselling', 56, 'Free counselling & school choice', 'निःशुल्क परामर्श र विद्यालय छनोट', 'Choose a language school and intake.'),
    step('language', 52, 'Start Japanese classes (N5)', 'जापानी भाषा कक्षा (N5)', 'Build the study hours and level schools require.'),
    step('apply', 36, 'Apply to school with documents', 'विद्यालयमा आवेदन', 'Submit academic, sponsor and financial documents.'),
    step('exam', 30, 'JLPT/NAT exam & school interview', 'JLPT/NAT परीक्षा र अन्तर्वार्ता', 'Sit the language test and the school interview.'),
    step('coe', 16, 'Certificate of Eligibility issued', 'COE जारी', 'Immigration issues your COE through the school.'),
    step('tuition', 14, 'Pay first-year tuition', 'पहिलो वर्षको शुल्क', 'Pay tuition once the COE is issued.'),
    step('visa', 8, 'Visa at Embassy of Japan', 'जापानी दूतावासमा भिसा', 'Apply for the student visa in Kathmandu.'),
    step('travel', 2, 'Book flight & pre-departure', 'उडान र प्रस्थान-पूर्व तयारी', 'Book flights and attend the pre-departure briefing.'),
  ],
};

// ---------------------------------------------------------------------------
// Scholarships (TODO: re-check eligibility for Nepali applicants and deadlines every cycle)
// ---------------------------------------------------------------------------

export const scholarships: Scholarship[] = [
  {
    id: 'chevening', name: 'Chevening Scholarships', provider: 'UK Government (FCDO)', countries: ['uk'], levels: ['pg'], fields: ['any'],
    min_percent: null, coverage: 'full', amount: L('Tuition, living allowance, flights'),
    summary: L('Fully funded one-year master’s degrees in the UK for future leaders with at least two years of work experience.'),
    deadline: L('Usually early November'), url: 'https://www.chevening.org/', verified_on: null, sort: 0, published: true,
  },
  {
    id: 'australia-awards', name: 'Australia Awards Scholarships', provider: 'Australian Government (DFAT)', countries: ['australia'], levels: ['pg'], fields: ['any'],
    min_percent: null, coverage: 'full', amount: L('Tuition, travel, living allowance, health cover'),
    summary: L('Long-term development awards for postgraduate study in Australia; check the current eligible-country list and priority fields.'),
    deadline: L('Varies by round'), url: 'https://www.dfat.gov.au/people-to-people/australia-awards', verified_on: null, sort: 1, published: true,
  },
  {
    id: 'fulbright', name: 'Fulbright Foreign Student Program', provider: 'U.S. Department of State / USEF-Nepal', countries: ['usa'], levels: ['pg'], fields: ['any'],
    min_percent: null, coverage: 'full', amount: L('Tuition, living stipend, airfare, health insurance'),
    summary: L('Graduate study in the USA for Nepali citizens, administered in Nepal by the U.S. Educational Foundation.'),
    deadline: L('Check USEF-Nepal for the current cycle'), url: 'https://www.usefnepal.org/', verified_on: null, sort: 2, published: true,
  },
  {
    id: 'mext', name: 'MEXT (Monbukagakusho) Scholarship', provider: 'Government of Japan', countries: ['japan'], levels: ['ug', 'pg', 'diploma'], fields: ['any'],
    min_percent: 65, coverage: 'full', amount: L('Tuition, monthly stipend, round-trip airfare'),
    summary: L('Japanese Government scholarships for undergraduate, research and college-of-technology study, applied through the Embassy of Japan.'),
    deadline: L('Usually announced around April–May'), url: 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/', verified_on: null, sort: 3, published: true,
  },
  {
    id: 'jasso', name: 'JASSO Honors Scholarship', provider: 'Japan Student Services Organization', countries: ['japan'], levels: ['language', 'diploma', 'ug', 'pg'], fields: ['any'],
    min_percent: null, coverage: 'partial', amount: L('Monthly stipend'),
    summary: L('Monthly support for privately financed international students with strong results, recommended by their school.'),
    deadline: L('Through your school'), url: 'https://www.jasso.go.jp/en/', verified_on: null, sort: 4, published: true,
  },
  {
    id: 'manaaki', name: 'Manaaki New Zealand Scholarships', provider: 'New Zealand Government (MFAT)', countries: ['new-zealand'], levels: ['pg'], fields: ['any'],
    min_percent: null, coverage: 'full', amount: L('Tuition, living allowance, travel, insurance'),
    summary: L('Government scholarships for eligible countries — confirm whether Nepali citizens are eligible in the current round.'),
    deadline: L('Varies by round'), url: 'https://www.nzscholarships.govt.nz/', verified_on: null, sort: 5, published: true,
  },
  {
    id: 'vanier', name: 'Vanier Canada Graduate Scholarships', provider: 'Government of Canada', countries: ['canada'], levels: ['pg'], fields: ['any'],
    min_percent: 80, coverage: 'full', amount: L('Annual award for doctoral study'),
    summary: L('Highly competitive awards for doctoral students nominated by a Canadian university.'),
    deadline: L('Set by the nominating university'), url: 'https://vanier.gc.ca/', verified_on: null, sort: 6, published: true,
  },
  {
    id: 'uni-merit', name: 'University international merit scholarships', provider: 'Partner universities', countries: ['uk', 'australia', 'canada', 'usa', 'new-zealand', 'cyprus'], levels: ['diploma', 'ug', 'pg'], fields: ['any'],
    min_percent: 60, coverage: 'partial', amount: L('Typically 10–50% of tuition'),
    summary: L('Many universities automatically reduce tuition for strong academic profiles — our counsellors match you to current offers.'),
    deadline: L('With your application'), url: 'https://stxavier.com.np/en/contact', verified_on: null, sort: 7, published: true,
  },
];

// ---------------------------------------------------------------------------
// English requirements (TODO: verify every threshold with the linked source)
// ---------------------------------------------------------------------------

const er = (
  id: string, country: string, kind: EnglishRequirement['kind'], label: string,
  overall: number | null, minBand: number | null, pte: number | null, note: string | null, source: string | null, sort: number,
): EnglishRequirement => ({
  id, country, kind, label: L(label), ielts_overall: overall, ielts_min_band: minBand, pte_overall: pte,
  note: note ? L(note) : null, source_url: source, sort, published: true,
});

export const englishRequirements: EnglishRequirement[] = [
  er('uk-visa', 'uk', 'visa', 'UK Student visa (degree level, if the university does not assess English)', null, 5.5, null, 'Usually IELTS for UKVI Academic with at least 5.5 in each component (CEFR B2).', 'https://www.gov.uk/student-visa/knowledge-of-english', 0),
  er('uk-ug', 'uk', 'university', 'Typical UK undergraduate entry', 6, 5.5, 50, 'Varies by university and course.', null, 1),
  er('uk-pg', 'uk', 'university', 'Typical UK postgraduate entry', 6.5, 6, 58, 'Varies by university and course.', null, 2),
  er('au-visa', 'australia', 'visa', 'Australian Student visa (subclass 500)', 6, null, null, 'Lower scores may be accepted with packaged English (ELICOS) study.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 3),
  er('au-pg', 'australia', 'university', 'Typical Australian postgraduate entry', 6.5, 6, 58, 'Nursing and teaching usually require higher scores.', null, 4),
  er('ca-college', 'canada', 'university', 'Typical Canadian college diploma entry', 6, 5.5, 50, null, null, 5),
  er('ca-pg', 'canada', 'university', 'Typical Canadian university postgraduate entry', 6.5, 6, 58, null, null, 6),
  er('us-ug', 'usa', 'university', 'Typical US undergraduate entry', 6, null, 50, 'Many universities also accept TOEFL or Duolingo.', null, 7),
  er('us-pg', 'usa', 'university', 'Typical US graduate entry', 6.5, null, 58, null, null, 8),
  er('nz-ug', 'new-zealand', 'university', 'Typical New Zealand undergraduate entry', 6, 5.5, 50, null, null, 9),
  er('nz-pg', 'new-zealand', 'university', 'Typical New Zealand postgraduate entry', 6.5, 6, 58, null, null, 10),
  er('cy-ug', 'cyprus', 'university', 'Typical Cyprus private-university entry', 5.5, null, 43, 'Some universities offer their own English test.', null, 11),
];

// ---------------------------------------------------------------------------
// Nepali grading scales (TODO: confirm bands with NEB / TU notices)
// ---------------------------------------------------------------------------

export const gradingScales: GradingScale[] = [
  {
    id: 'neb', name: L('NEB (+2 / SEE) letter grading', 'NEB (+२ / SEE) ग्रेडिङ'),
    description: L('National Examinations Board letter grades used for Grade 11–12 and SEE results.'),
    max_gpa: 4,
    bands: [
      { grade: 'A+', gpa: 4.0, min: 90, max: 100, remark: L('Outstanding') },
      { grade: 'A', gpa: 3.6, min: 80, max: 90, remark: L('Excellent') },
      { grade: 'B+', gpa: 3.2, min: 70, max: 80, remark: L('Very good') },
      { grade: 'B', gpa: 2.8, min: 60, max: 70, remark: L('Good') },
      { grade: 'C+', gpa: 2.4, min: 50, max: 60, remark: L('Satisfactory') },
      { grade: 'C', gpa: 2.0, min: 40, max: 50, remark: L('Acceptable') },
      { grade: 'D', gpa: 1.6, min: 35, max: 40, remark: L('Basic') },
      { grade: 'NG', gpa: 0, min: 0, max: 35, remark: L('Not graded') },
    ],
    source: { label: 'National Examinations Board (NEB)', url: 'https://www.neb.gov.np/', accessed: '2026-10-15' },
    sort: 0,
  },
  {
    id: 'tu', name: L('Tribhuvan University (semester CGPA)', 'त्रिभुवन विश्वविद्यालय (सेमेस्टर CGPA)'),
    description: L('Common 4.0 CGPA bands used in TU semester programmes. Some faculties use different scales — check your transcript.'),
    max_gpa: 4,
    bands: [
      { grade: 'A', gpa: 4.0, min: 90, max: 100, remark: L('Distinction') },
      { grade: 'A-', gpa: 3.7, min: 80, max: 90, remark: L('Very good') },
      { grade: 'B+', gpa: 3.3, min: 70, max: 80, remark: L('First division') },
      { grade: 'B', gpa: 3.0, min: 60, max: 70, remark: L('Second division') },
      { grade: 'B-', gpa: 2.7, min: 50, max: 60, remark: L('Pass') },
      { grade: 'F', gpa: 0, min: 0, max: 50, remark: L('Fail') },
    ],
    source: { label: 'Tribhuvan University', url: 'https://tu.edu.np/', accessed: '2026-10-15' },
    sort: 1,
  },
];

// ---------------------------------------------------------------------------
// Tool page copy + shared settings
// ---------------------------------------------------------------------------

const hero = (title: [string, string], highlight: [string, string], subtitle: [string, string]) => ({
  eyebrow: L('Free Tool', 'निःशुल्क उपकरण'),
  title: L(...title),
  highlight: L(...highlight),
  subtitle: L(...subtitle),
  image: null,
});
const section = (heading: string, ...body: string[]) => ({ heading: L(heading), body: body.map((b) => L(b)) });
const UPDATED = '2026-10-16';

export const toolContents: Record<string, ToolContent> = {
  'eligibility-checker': {
    hero: hero(['Study Abroad Eligibility Checker', 'विदेश अध्ययन योग्यता जाँच'], ['Eligibility Checker', 'योग्यता जाँच'], ['Answer 7 quick questions to see which countries and courses fit your profile.', '७ छोटा प्रश्नको उत्तर दिनुहोस् र तपाईंलाई मिल्ने देश र कोर्स हेर्नुहोस्।']),
    answer: L('The St. Xavier eligibility checker compares your study level, grades, English score, yearly budget and preferences with typical requirements for the UK, Australia, Canada, the USA, New Zealand, Cyprus and Japan, then ranks each country with a match score out of 100.'),
    sections: [
      section('How is the match score calculated?', 'Budget carries the most weight (40%), followed by academic results (25%), English score (20%), your country preference (10%) and how strong the country is in your field (5%).', 'Thresholds are typical figures, not admission rules — every university sets its own requirements.'),
      section('What should I do after seeing my results?', 'Book a free counselling session. A counsellor will check your documents, confirm real university requirements and look for scholarships that improve your options.'),
    ],
    updated: UPDATED,
  },
  'cost-calculator': {
    hero: hero(['Cost of Study Abroad Calculator', 'विदेश अध्ययन खर्च क्याल्कुलेटर'], ['Calculator', 'क्याल्कुलेटर'], ['Estimate tuition and living costs in NPR for any destination.', 'कुनै पनि गन्तव्यको शुल्क र बस्ने खर्च NPR मा अनुमान गर्नुहोस्।']),
    answer: L('The cost of studying abroad from Nepal depends on the country, level, city and course length. This calculator adds typical tuition, living costs, health cover and visa fees, then converts the total into Nepali rupees using Nepal Rastra Bank exchange rates.'),
    sections: [
      section('Where do the exchange rates come from?', 'We use the Nepal Rastra Bank selling rate published for the day. Currencies NRB does not publish are converted through the US dollar. If live rates are unavailable, a dated fallback rate is shown.'),
      section('Is this the amount I must show for my visa?', 'Not exactly. Each country sets its own proof-of-funds rule. Use this estimate for planning and ask a counsellor for the exact visa financial requirement.'),
    ],
    updated: UPDATED,
  },
  'scholarship-finder': {
    hero: hero(['Scholarship Finder for Nepali Students', 'नेपाली विद्यार्थीका लागि छात्रवृत्ति खोजी'], ['Scholarship Finder', 'छात्रवृत्ति खोजी'], ['Filter scholarships by country, level, grades and field.', 'देश, तह, अंक र विषयअनुसार छात्रवृत्ति खोज्नुहोस्।']),
    answer: L('Nepali students can apply for fully funded government scholarships such as Chevening (UK), Australia Awards, Fulbright (USA) and MEXT (Japan), as well as partial university merit scholarships that reduce tuition by 10–50%. Filter the list to see which ones match your profile.'),
    sections: [
      section('How competitive are fully funded scholarships?', 'Government scholarships are highly competitive and usually require strong academics, leadership and sometimes work experience. University merit scholarships are easier to obtain and often awarded automatically with your offer.'),
      section('Always check the official page', 'Eligibility and deadlines change every cycle. Each listing links to the official website — confirm details there before applying.'),
    ],
    updated: UPDATED,
  },
  'ielts-band-calculator': {
    hero: hero(['IELTS & PTE Score Calculator', 'IELTS र PTE स्कोर क्याल्कुलेटर'], ['Score Calculator', 'स्कोर क्याल्कुलेटर'], ['Calculate your overall band and see which requirements you meet.', 'समग्र ब्यान्ड निकाल्नुहोस् र कुन आवश्यकता पूरा हुन्छ हेर्नुहोस्।']),
    answer: L('Your IELTS overall band is the average of Listening, Reading, Writing and Speaking, rounded to the nearest half band. An average ending in .25 rounds up to the next half band and .75 rounds up to the next whole band — so 6.25 becomes 6.5 and 6.75 becomes 7.0.'),
    sections: [
      section('How is the PTE overall score calculated?', 'Pearson calculates the PTE Academic overall score from every item in the test, so it is not a simple average of the four skills. The PTE result here is an estimate for planning only.'),
      section('What score do I need?', 'Most universities ask for IELTS 6.0 for undergraduate and 6.5 for postgraduate study, with minimum bands in each skill. Visa rules can differ from university requirements — the table below shows both.'),
    ],
    updated: UPDATED,
  },
  'gpa-percentage-converter': {
    hero: hero(['GPA to Percentage Converter (NEB & TU)', 'GPA देखि प्रतिशत रूपान्तरण (NEB र TU)'], ['GPA to Percentage', 'GPA देखि प्रतिशत'], ['Convert NEB and Tribhuvan University grades both ways.', 'NEB र त्रिभुवन विश्वविद्यालयको ग्रेड दुवैतर्फ रूपान्तरण गर्नुहोस्।']),
    answer: L('NEB and Tribhuvan University report grades on a 4.0 scale. To convert a GPA to an approximate percentage, find the grade band your GPA falls in and interpolate between the band boundaries — for example, an NEB GPA of 3.4 is roughly 75%.'),
    sections: [
      section('Will universities use this exact conversion?', 'Not always. Many universities and credential evaluators use their own conversion tables, so treat these results as approximate and include your official transcript and grading key with applications.'),
    ],
    updated: UPDATED,
  },
  'visa-timeline-planner': {
    hero: hero(['Study Abroad Visa Timeline Planner', 'विदेश अध्ययन भिसा समयरेखा योजनाकार'], ['Timeline Planner', 'समयरेखा योजनाकार'], ['Pick your intake and get a step-by-step plan with dates.', 'इन्टेक छान्नुहोस् र मितिसहित चरणबद्ध योजना पाउनुहोस्।']),
    answer: L('Start preparing about 10–12 months before your intake. Working backwards from the course start date, you should take your English test around 9 months before, apply around 7–8 months before, secure your enrolment document 4 months before and lodge your visa 2–3 months before departure.'),
    sections: [
      section('What if some steps are already past?', 'Past dates are highlighted. You can often still make the intake by compressing steps — talk to a counsellor quickly, or consider the next intake.'),
      section('Add it to your calendar', 'Download the plan as an .ics calendar file or add individual steps to Google Calendar so you never miss a deadline.'),
    ],
    updated: UPDATED,
  },
  'document-checklist': {
    hero: hero(['Study Abroad Document Checklist', 'विदेश अध्ययन कागजात सूची'], ['Document Checklist', 'कागजात सूची'], ['Get the exact documents you need for your country and level.', 'तपाईंको देश र तहका लागि चाहिने कागजात हेर्नुहोस्।']),
    answer: L('Most study visa applications from Nepal need a valid passport, academic transcripts, an English test score, an offer letter, a Statement of Purpose, financial documents and a No Objection Certificate (NOC) from the Ministry of Education. Each country adds its own documents, such as a CAS for the UK or a COE for Japan.'),
    sections: [
      section('Your progress is saved', 'Ticks are saved in your browser, so you can come back and continue. Nothing is uploaded until you choose to share documents with your counsellor.'),
    ],
    updated: UPDATED,
  },
  'country-comparison': {
    hero: hero(['Compare Study Abroad Countries', 'विदेश अध्ययन देश तुलना'], ['Compare', 'तुलना'], ['Compare up to 3 countries side by side.', '३ वटासम्म देश एकैसाथ तुलना गर्नुहोस्।']),
    answer: L('Compare countries on tuition, living costs, part-time work rights, post-study work options, intakes and visa processing time. For most Nepali students the deciding factors are total cost, work rights during study and post-study work opportunities.'),
    sections: [
      section('Which country is cheapest to study in?', 'Among our destinations, Cyprus and Japan usually have the lowest total cost, while the USA, the UK and Australia are usually the most expensive. Your course and city change this a lot — use the cost calculator for your exact case.'),
    ],
    updated: UPDATED,
  },
  'education-loan-emi-calculator': {
    hero: hero(['Education Loan EMI Calculator', 'शैक्षिक ऋण EMI क्याल्कुलेटर'], ['EMI Calculator', 'EMI क्याल्कुलेटर'], ['Work out monthly instalments, total interest and repayment.', 'मासिक किस्ता, कुल ब्याज र भुक्तानी निकाल्नुहोस्।']),
    answer: L('An education loan EMI is calculated with the reducing-balance formula EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly interest rate and n the number of monthly instalments. Higher rates and longer tenures increase the total interest you pay.'),
    sections: [
      section('What interest rate should I use?', 'Use the rate quoted by your bank. Education-loan rates in Nepal change with the bank’s base rate, so confirm the current rate and any service charges before you decide.'),
      section('Does the loan count as proof of funds?', 'Many embassies accept an education-loan sanction letter as part of your financial evidence. Ask your counsellor how your destination treats loans.'),
    ],
    updated: UPDATED,
  },
};

export const toolsConfig: ToolsConfig = {
  index: {
    eyebrow: L('Free Tools', 'निःशुल्क उपकरण'),
    title: L('Free study abroad tools', 'निःशुल्क विदेश अध्ययन उपकरण'),
    highlight: L('tools', 'उपकरण'),
    subtitle: L('Plan costs, check eligibility, convert grades and build your visa timeline — free.', 'खर्च योजना, योग्यता जाँच, ग्रेड रूपान्तरण र भिसा समयरेखा — निःशुल्क।'),
    image: null,
  },
  fields: [
    { key: 'business', label: L('Business & Management', 'व्यवसाय र व्यवस्थापन') },
    { key: 'it', label: L('Computer Science & IT', 'कम्प्युटर विज्ञान र IT') },
    { key: 'data', label: L('Data Science & AI', 'डाटा साइन्स र AI') },
    { key: 'engineering', label: L('Engineering', 'इन्जिनियरिङ') },
    { key: 'health', label: L('Nursing & Health', 'नर्सिङ र स्वास्थ्य') },
    { key: 'hospitality', label: L('Hospitality & Tourism', 'होटल व्यवस्थापन र पर्यटन') },
    { key: 'arts', label: L('Arts, Law & Humanities', 'कला, कानून र मानविकी') },
  ],
  checklist_extras: {
    language: [L('Japanese study-hours certificate'), L('Sponsor relationship documents')],
    diploma: [L('+2 / A-Level transcript and character certificate'), L('Gap-year explanation (if any)')],
    ug: [L('SEE and +2 / A-Level transcripts, migration and character certificates'), L('Two academic reference letters'), L('Gap-year explanation (if any)')],
    pg: [L('Bachelor’s transcripts, provisional certificate and degree'), L('Two letters of recommendation (academic or work)'), L('CV / résumé'), L('Work experience letters (if any)')],
  },
  loan_defaults: { principal: 2_500_000, rate: 11, years: 7 },
  // NRB selling rates, 2026-10-16 (NZD derived via USD). Used only if live rates fail.
  fallback_rates: { date: '2026-10-16', rates: { USD: 152.4, EUR: 170.95, GBP: 202.1, AUD: 105.38, CAD: 107.3, JPY: 0.966, NZD: 88.4 } },
};
