import type { Localized, Service, TestPrepDetails, TextBlock } from '@/types/content';

const L = (en: string, ne?: string): Localized => (ne ? { en, ne } : { en });
const B = (title: string, text: string): TextBlock => ({ title: L(title), text: L(text) });
const ACCESSED = '2026-10-15';

// TODO: confirm real batch times, durations and fees with the test-prep team. Fees are null
// (hidden on the page) until confirmed. Exam formats must be re-checked with the test owner.
const morningEvening = [
  { name: L('Morning batch', 'बिहानको ब्याच'), time: '07:00 – 09:00', days: L('Sunday – Friday', 'आइतबार – शुक्रबार') },
  { name: L('Day batch', 'दिउँसोको ब्याच'), time: '12:00 – 14:00', days: L('Sunday – Friday', 'आइतबार – शुक्रबार') },
  { name: L('Evening batch', 'साँझको ब्याच'), time: '17:00 – 19:00', days: L('Sunday – Friday', 'आइतबार – शुक्रबार') },
];

export const testPrepDetails: Record<string, TestPrepDetails> = {
  ielts: {
    overview: L(
      'IELTS (International English Language Testing System) is the most widely accepted English test for study in the UK, Australia, Canada and New Zealand. Our IELTS classes in Kathmandu cover Academic and General Training with small batches, weekly full mock tests and individual feedback on Writing and Speaking.',
    ),
    format: [
      { section: 'Listening', duration: '≈ 30 min', detail: L('4 recordings, 40 questions.') },
      { section: 'Reading', duration: '60 min', detail: L('3 long passages, 40 questions.') },
      { section: 'Writing', duration: '60 min', detail: L('Task 1 (report/letter) and Task 2 (essay).') },
      { section: 'Speaking', duration: '11–14 min', detail: L('Face-to-face interview in three parts.') },
    ],
    batches: morningEvening,
    duration: L('6 weeks (flexible)', '६ हप्ता (लचिलो)'),
    fee: null,
    mode: 'blended',
    features: [L('Weekly full-length mock tests'), L('One-to-one Speaking practice'), L('Writing correction with band feedback'), L('Computer-delivered IELTS practice'), L('Free test registration support')],
    sources: [{ label: 'IELTS — Test format', url: 'https://ielts.org/take-a-test/test-types/ielts-academic-test', accessed: ACCESSED }],
  },
  pte: {
    overview: L(
      'PTE Academic is a fully computer-based English test with fast results, accepted for study and visas in Australia, the UK, New Zealand and many universities worldwide. Our PTE classes focus on the AI-scored question types, timing strategy and scored practice tests.',
    ),
    format: [
      { section: 'Speaking & Writing', duration: '≈ 55–70 min', detail: L('Read aloud, repeat sentence, describe image, essay and more.') },
      { section: 'Reading', duration: '≈ 30 min', detail: L('Multiple choice, re-order paragraphs, fill in the blanks.') },
      { section: 'Listening', duration: '≈ 30–45 min', detail: L('Summarise spoken text, highlight correct summary, write from dictation.') },
    ],
    batches: morningEvening,
    duration: L('4–6 weeks', '४–६ हप्ता'),
    fee: null,
    mode: 'onsite',
    features: [L('Scored mock tests'), L('Templates and timing strategies'), L('Computer lab practice'), L('Score-gap analysis')],
    sources: [{ label: 'Pearson PTE Academic', url: 'https://www.pearsonpte.com/pte-academic', accessed: ACCESSED }],
  },
  toefl: {
    overview: L(
      'TOEFL iBT is an internet-based English test accepted by universities in the USA, Canada and worldwide. Our TOEFL preparation covers all four skills with academic-style practice and full-length practice tests.',
    ),
    format: [
      { section: 'Reading', duration: 'TODO', detail: L('Academic passages and questions.') },
      { section: 'Listening', duration: 'TODO', detail: L('Lectures and conversations.') },
      { section: 'Writing', duration: 'TODO', detail: L('Integrated and academic discussion tasks.') },
      { section: 'Speaking', duration: 'TODO', detail: L('Independent and integrated tasks.') },
    ],
    batches: morningEvening.slice(0, 2),
    duration: L('6 weeks', '६ हप्ता'),
    fee: null,
    mode: 'blended',
    features: [L('Full-length practice tests'), L('Academic vocabulary building'), L('Integrated task strategies')],
    sources: [{ label: 'ETS — TOEFL iBT', url: 'https://www.ets.org/toefl/test-takers/ibt/about.html', accessed: ACCESSED }],
  },
  japanese: {
    overview: L(
      'Our Japanese language classes prepare students for JLPT and NAT-TEST levels N5 and N4 — the level most Japanese language schools require for the Certificate of Eligibility. Classes cover hiragana, katakana, kanji, grammar, listening and interview practice.',
    ),
    format: [
      { section: 'JLPT N5', duration: '≈ 105 min', detail: L('Vocabulary, grammar & reading, and listening.') },
      { section: 'JLPT N4', duration: '≈ 125 min', detail: L('Vocabulary, grammar & reading, and listening.') },
      { section: 'NAT-TEST', duration: 'Varies by level', detail: L('Held several times a year; accepted by many language schools.') },
    ],
    batches: morningEvening,
    duration: L('3–6 months (N5 → N4)', '३–६ महिना (N5 → N4)'),
    fee: null,
    mode: 'onsite',
    features: [L('Native-level pronunciation practice'), L('Study-hours certificate for your COE'), L('School interview preparation'), L('Monthly mock exams')],
    sources: [{ label: 'JLPT — Official site', url: 'https://www.jlpt.jp/e/', accessed: ACCESSED }],
  },
};

export const serviceDetails: Record<string, NonNullable<Service['details']>> = {
  'study-abroad-counselling': {
    intro: L('Our study abroad counselling is free, one-to-one and honest. We assess your academics, budget and goals, then recommend countries, courses and universities that genuinely fit — and guide you through applications, scholarships and visas.'),
    points: [
      B('Profile assessment', 'We review your grades, gap years, English level and budget to set realistic options.'),
      B('Country & course selection', 'Compare destinations on cost, work rights and career outcomes.'),
      B('Application management', 'SOPs, LORs, applications and deadlines handled with you.'),
      B('Visa & pre-departure', 'Document checks, interview practice and travel briefing.'),
    ],
  },
  'mock-test': {
    intro: L('Exam-condition mock tests for IELTS, PTE and TOEFL with scored results and detailed feedback, so you know exactly where you stand before the real exam.'),
    points: [
      B('Real exam conditions', 'Timed, full-length tests in a quiet test room or computer lab.'),
      B('Scored feedback', 'Section-wise scores with notes on what to improve.'),
      B('Speaking assessment', 'Face-to-face IELTS speaking tests with certified trainers.'),
    ],
  },
  'test-preparation': {
    intro: L('Structured IELTS, PTE, TOEFL and Japanese language classes in small batches, with flexible timings and regular mock tests.'),
    points: [
      B('Small batches', 'More attention and practice time for every student.'),
      B('Flexible timings', 'Morning, day and evening batches.'),
      B('Proven materials', 'Up-to-date practice material and strategy sessions.'),
    ],
  },
  'test-registration': {
    intro: L('We register you for IELTS, PTE, TOEFL and JLPT/NAT on the right date, at the right centre and in the right format for your university and visa.'),
    points: [
      B('Right test, right format', 'Academic vs General, paper vs computer — we confirm what your institution accepts.'),
      B('Date planning', 'Book a date that leaves time for results before application deadlines.'),
      B('Hassle-free payment', 'We handle the registration process with you.'),
    ],
  },
};
