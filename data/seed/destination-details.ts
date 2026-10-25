import type { DestinationDetails, Localized, TextBlock } from '@/types/content';

/**
 * Country-page content. Nepali falls back to English until translations are added.
 *
 * TODO: every figure here (fees, funds, work hours, visa durations) is an approximate
 * reference and MUST be checked against the linked official source before launch. Rules for
 * international students change often; update `accessed` dates when you re-verify.
 */

const L = (en: string, ne?: string): Localized => (ne ? { en, ne } : { en });
const B = (title: string, text: string): TextBlock => ({ title: L(title), text: L(text) });
const ACCESSED = '2026-10-15';

const commonDocs = [
  L('Valid passport (at least 6 months beyond your planned stay)'),
  L('Academic transcripts and certificates (SEE, +2 / A-Level, Bachelor’s if applicable)'),
  L('English test score (IELTS, PTE or TOEFL) or language certificate'),
  L('Offer / admission letter from the institution'),
  L('Statement of Purpose (SOP) and CV'),
  L('Financial documents: bank balance certificate, sponsor letters, income sources, education loan letter if any'),
  L('No Objection Certificate (NOC) from Nepal’s Ministry of Education, Science & Technology for foreign-exchange transfer'),
  L('Passport-size photographs and completed visa application forms'),
];

export const destinationDetails: Record<string, DestinationDetails> = {
  uk: {
    intro: L(
      'Studying in the UK from Nepal means a world-recognised degree in less time: most bachelor’s degrees take three years and most master’s just one. You need an offer from a licensed university, a CAS, proof of funds and an English test, then you apply for the UK Student visa online.',
    ),
    why: [
      B('Shorter degrees', 'One-year master’s programmes and three-year bachelor’s degrees reduce total tuition and living costs.'),
      B('Global reputation', 'UK universities consistently feature among the world’s top-ranked institutions.'),
      B('Post-study work', 'The Graduate route lets eligible graduates stay and work after their course (check the current duration).'),
      B('Diverse intakes', 'Most universities offer September and January intakes, and some offer May.'),
    ],
    costs: {
      answer: L(
        'Tuition for international students typically ranges from about £11,000 to £38,000 per year depending on the university and subject, plus living costs of roughly £1,100–£1,500 per month. UKVI requires you to show maintenance funds for up to nine months on top of unpaid tuition.',
      ),
      tuition: [
        { level: L('Undergraduate'), range: L('£11,000 – £38,000 / year') },
        { level: L('Postgraduate (taught)'), range: L('£12,000 – £35,000 / year') },
      ],
      living: [
        { item: L('Accommodation'), amount: L('£500 – £1,000 / month') },
        { item: L('Food & groceries'), amount: L('£200 – £300 / month') },
        { item: L('Transport'), amount: L('£50 – £150 / month') },
        { item: L('Immigration Health Surcharge'), amount: L('Paid upfront per year of visa') },
      ],
      note: L('Approximate figures for planning only. TODO: verify current UKVI maintenance amounts and IHS fee.'),
    },
    courses: [L('Business & Management'), L('Computer Science & Data Science'), L('Engineering'), L('Nursing & Health Sciences'), L('Law'), L('Hospitality & Tourism')],
    universities: [
      { name: 'University of Leeds', city: 'Leeds', url: null },
      { name: 'Coventry University', city: 'Coventry', url: null },
      { name: 'University of Greenwich', city: 'London', url: null },
      { name: 'University of Hertfordshire', city: 'Hatfield', url: null },
      { name: 'University of East Anglia', city: 'Norwich', url: null },
    ],
    scholarships: [
      { name: 'Chevening Scholarships', detail: L('Fully funded UK government awards for one-year master’s degrees.'), url: 'https://www.chevening.org/' },
      { name: 'University international scholarships', detail: L('Most universities offer automatic or merit-based tuition discounts for international students.'), url: null },
    ],
    visa: {
      answer: L(
        'To get a UK Student visa from Nepal you need a Confirmation of Acceptance for Studies (CAS) from a licensed sponsor, proof of English, proof of funds held for 28 days, a TB test certificate, and to apply online and give biometrics at the visa application centre in Kathmandu.',
      ),
      steps: [
        B('Get an unconditional offer', 'Meet your university’s academic and English requirements and accept the offer.'),
        B('Pay deposit & receive CAS', 'Pay the tuition deposit; the university issues your Confirmation of Acceptance for Studies.'),
        B('Prepare funds & TB test', 'Hold the required funds for 28 consecutive days and take a TB test at an approved clinic.'),
        B('Apply online & pay fees', 'Complete the online application, pay the visa fee and Immigration Health Surcharge.'),
        B('Biometrics appointment', 'Attend the visa application centre in Kathmandu to give fingerprints and a photo.'),
        B('Decision & travel', 'Receive your decision and collect your BRP/eVisa details, then plan arrival before your course starts.'),
      ],
      total_time: 'P3W',
    },
    documents: [...commonDocs, L('Confirmation of Acceptance for Studies (CAS)'), L('Tuberculosis (TB) test certificate')],
    work: L(
      'Yes. Students on a degree-level course can usually work up to 20 hours per week during term time and full-time during official vacations. The exact limit is printed on your visa and depends on your course level. TODO: verify current rules.',
    ),
    life: {
      city: 'London',
      text: L('A multicultural capital with excellent transport, world-class museums and part-time work opportunities, though living costs are higher than elsewhere in the UK.'),
      nepali_community: L('Large Nepali communities live in London and Aldershot, with active student associations at many universities.'),
    },
    sources: [
      { label: 'GOV.UK: Student visa', url: 'https://www.gov.uk/student-visa', accessed: ACCESSED },
      { label: 'GOV.UK: Graduate visa', url: 'https://www.gov.uk/graduate-visa', accessed: ACCESSED },
    ],
  },

  australia: {
    intro: L(
      'Studying in Australia from Nepal combines globally ranked universities with generous post-study work rights and one of the largest Nepali student communities abroad. You apply for a Student visa (subclass 500) after receiving a Confirmation of Enrolment (CoE) and must show genuine study intent and sufficient funds.',
    ),
    why: [
      B('Group of Eight universities', 'Australia’s research-intensive universities rank among the best in the world.'),
      B('Work while you study', 'Student visa holders can work a set number of hours per fortnight during term and unlimited hours in breaks.'),
      B('Post-study work visa', 'Eligible graduates can apply for a Temporary Graduate visa (subclass 485).'),
      B('Nepali community', 'Sydney, Melbourne and Brisbane have large, supportive Nepali communities.'),
    ],
    costs: {
      answer: L(
        'International tuition in Australia usually ranges from about AUD 20,000 to 50,000 per year depending on the course, and the Department of Home Affairs sets a minimum annual living-cost amount you must show. You also need Overseas Student Health Cover (OSHC) for your whole stay.',
      ),
      tuition: [
        { level: L('Undergraduate'), range: L('AUD 20,000 – 45,000 / year') },
        { level: L('Postgraduate'), range: L('AUD 22,000 – 50,000 / year') },
        { level: L('Vocational (VET)'), range: L('AUD 8,000 – 22,000 / year') },
      ],
      living: [
        { item: L('Accommodation (shared)'), amount: L('AUD 900 – 1,800 / month') },
        { item: L('Food & groceries'), amount: L('AUD 350 – 600 / month') },
        { item: L('Transport'), amount: L('AUD 120 – 250 / month') },
        { item: L('OSHC health cover'), amount: L('Required for the full visa period') },
      ],
      note: L('TODO: verify the current Home Affairs financial-capacity figure and visa application charge.'),
    },
    courses: [L('Nursing'), L('Information Technology'), L('Accounting & Business'), L('Engineering'), L('Hospitality Management'), L('Early Childhood Education')],
    universities: [
      { name: 'Monash University', city: 'Melbourne', url: null },
      { name: 'RMIT University', city: 'Melbourne', url: null },
      { name: 'Deakin University', city: 'Geelong / Melbourne', url: null },
      { name: 'Macquarie University', city: 'Sydney', url: null },
      { name: 'Western Sydney University', city: 'Sydney', url: null },
    ],
    scholarships: [
      { name: 'Australia Awards', detail: L('Australian Government scholarships for eligible countries (check Nepal eligibility each round).'), url: 'https://www.dfat.gov.au/people-to-people/australia-awards' },
      { name: 'University merit scholarships', detail: L('Many universities offer 10–30% tuition scholarships for strong academic profiles.'), url: null },
    ],
    visa: {
      answer: L(
        'For an Australian Student visa (subclass 500) from Nepal you need a Confirmation of Enrolment, Overseas Student Health Cover, evidence of English, proof of funds and a Genuine Student statement. You apply online through ImmiAccount and complete health checks and biometrics if requested.',
      ),
      steps: [
        B('Receive your offer', 'Accept your offer letter and meet any conditions.'),
        B('Pay & receive CoE', 'Pay the tuition deposit and OSHC; the institution issues your Confirmation of Enrolment.'),
        B('Prepare Genuine Student answers', 'Explain your study plans, ties to Nepal and how the course fits your career.'),
        B('Apply on ImmiAccount', 'Lodge the visa application online and pay the visa fee.'),
        B('Health check & biometrics', 'Complete the medical examination and biometrics when requested.'),
        B('Visa grant', 'Receive your visa grant notice and plan your arrival before orientation.'),
      ],
      total_time: 'P6W',
    },
    documents: [...commonDocs, L('Confirmation of Enrolment (CoE)'), L('Overseas Student Health Cover (OSHC) policy'), L('Genuine Student (GS) statement')],
    work: L(
      'Yes. Student visa holders can work a limited number of hours per fortnight while their course is in session and unlimited hours during scheduled course breaks. TODO: verify the current fortnightly limit with Home Affairs.',
    ),
    life: {
      city: 'Sydney',
      text: L('Beaches, a mild climate and a strong job market for students, with good public transport across the city.'),
      nepali_community: L('Sydney and Melbourne host some of the largest Nepali communities outside South Asia, with temples, restaurants and cultural events.'),
    },
    sources: [
      { label: 'Department of Home Affairs: Student visa (subclass 500)', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', accessed: ACCESSED },
      { label: 'Study Australia (Australian Government)', url: 'https://www.studyaustralia.gov.au/', accessed: ACCESSED },
    ],
  },

  canada: {
    intro: L(
      'Studying in Canada from Nepal gives you an affordable, high-quality education and a possible pathway to post-graduation work. You need an acceptance letter from a Designated Learning Institution, usually a provincial attestation letter, proof of funds and an English test before applying for a study permit online.',
    ),
    why: [
      B('Quality & safety', 'Canada is known for welcoming communities and high-quality public universities and colleges.'),
      B('Co-op programmes', 'Many programmes include paid work placements as part of the course.'),
      B('Post-graduation work', 'Eligible graduates can apply for a Post-Graduation Work Permit (PGWP).'),
      B('College pathways', 'Diploma and postgraduate certificate programmes offer practical, job-focused study.'),
    ],
    costs: {
      answer: L(
        'International tuition in Canada typically ranges from about CAD 15,000 to 40,000 per year. IRCC also requires proof that you can cover living costs for the first year in addition to tuition and travel, and the required amount is updated regularly.',
      ),
      tuition: [
        { level: L('College diploma / PG certificate'), range: L('CAD 15,000 – 22,000 / year') },
        { level: L('Undergraduate'), range: L('CAD 20,000 – 40,000 / year') },
        { level: L('Graduate'), range: L('CAD 18,000 – 35,000 / year') },
      ],
      living: [
        { item: L('Accommodation (shared)'), amount: L('CAD 700 – 1,400 / month') },
        { item: L('Food & groceries'), amount: L('CAD 300 – 500 / month') },
        { item: L('Transport'), amount: L('CAD 80 – 160 / month') },
      ],
      note: L('TODO: verify the current IRCC proof-of-funds amount and study permit fee.'),
    },
    courses: [L('Computer Science & IT'), L('Business Analytics'), L('Supply Chain Management'), L('Health Care & Nursing'), L('Engineering Technology'), L('Hospitality')],
    universities: [
      { name: 'University of Toronto', city: 'Toronto', url: null },
      { name: 'Humber Polytechnic', city: 'Toronto', url: null },
      { name: 'Conestoga College', city: 'Kitchener', url: null },
      { name: 'University of Windsor', city: 'Windsor', url: null },
      { name: 'Thompson Rivers University', city: 'Kamloops', url: null },
    ],
    scholarships: [
      { name: 'University entrance scholarships', detail: L('Many institutions award automatic entrance scholarships based on grades.'), url: null },
      { name: 'Vanier & graduate awards', detail: L('Competitive funding for doctoral and research students.'), url: null },
    ],
    visa: {
      answer: L(
        'To get a Canadian study permit from Nepal, you need a letter of acceptance from a Designated Learning Institution, a provincial or territorial attestation letter where required, proof of funds and identity documents. You apply online with IRCC and give biometrics at the visa application centre.',
      ),
      steps: [
        B('Get your letter of acceptance', 'Apply to a Designated Learning Institution (DLI) and accept your offer.'),
        B('Provincial attestation letter', 'Most applicants also need a PAL/TAL issued through the institution.'),
        B('Show proof of funds', 'Prepare bank statements, a GIC if used, and sponsor documents.'),
        B('Apply online with IRCC', 'Submit the study permit application and pay the fees.'),
        B('Biometrics & medical', 'Give biometrics and complete a medical exam if requested.'),
        B('Port of entry letter', 'On approval, travel with your letter of introduction; the permit is issued on arrival.'),
      ],
      total_time: 'P8W',
    },
    documents: [...commonDocs, L('Letter of acceptance from a DLI'), L('Provincial/territorial attestation letter (PAL/TAL)'), L('GIC certificate (if used)')],
    work: L(
      'Yes. Eligible full-time students can work off campus for a set number of hours per week during academic sessions and full-time during scheduled breaks. TODO: verify the current weekly limit with IRCC.',
    ),
    life: {
      city: 'Toronto',
      text: L('Canada’s largest city, with diverse neighbourhoods, a strong job market and easy access to colleges and universities.'),
      nepali_community: L('The Greater Toronto Area has a growing Nepali community with cultural organisations and events.'),
    },
    sources: [
      { label: 'IRCC: Study permit', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html', accessed: ACCESSED },
    ],
  },

  usa: {
    intro: L(
      'Studying in the USA from Nepal opens access to the world’s largest higher-education system, flexible degrees and research funding. After admission you receive a Form I-20, pay the SEVIS fee, complete the DS-160 and attend an F-1 visa interview at the U.S. Embassy in Kathmandu.',
    ),
    why: [
      B('Choice & flexibility', 'Thousands of accredited institutions and flexible majors let you shape your degree.'),
      B('Research & funding', 'Graduate students can access assistantships and research funding.'),
      B('Practical training', 'F-1 students can apply for Optional Practical Training (OPT), with an extension for STEM degrees.'),
      B('Two main intakes', 'Fall (August/September) and Spring (January), with some summer starts.'),
    ],
    costs: {
      answer: L(
        'Tuition for international students in the USA ranges widely: roughly USD 10,000 per year at some community colleges to over USD 50,000 at private universities. Your Form I-20 lists the estimated total cost of attendance, and you must show funds to cover at least the first year.',
      ),
      tuition: [
        { level: L('Community college'), range: L('USD 8,000 – 15,000 / year') },
        { level: L('Public university'), range: L('USD 20,000 – 40,000 / year') },
        { level: L('Private university'), range: L('USD 30,000 – 60,000 / year') },
      ],
      living: [
        { item: L('Accommodation'), amount: L('USD 600 – 1,500 / month') },
        { item: L('Food'), amount: L('USD 300 – 500 / month') },
        { item: L('Health insurance'), amount: L('Usually required by the university') },
      ],
      note: L('TODO: verify current SEVIS and visa application fees.'),
    },
    courses: [L('Computer Science'), L('Data Science & Analytics'), L('Business Administration (MBA)'), L('Engineering'), L('Public Health'), L('Biotechnology')],
    universities: [
      { name: 'Arizona State University', city: 'Tempe, AZ', url: null },
      { name: 'University of Texas at Arlington', city: 'Arlington, TX', url: null },
      { name: 'Southeast Missouri State University', city: 'Cape Girardeau, MO', url: null },
      { name: 'University of Central Missouri', city: 'Warrensburg, MO', url: null },
      { name: 'Northeastern University', city: 'Boston, MA', url: null },
    ],
    scholarships: [
      { name: 'Fulbright Foreign Student Program', detail: L('U.S. government-funded graduate study for eligible Nepali applicants.'), url: 'https://usefnepal.org/' },
      { name: 'University merit awards & assistantships', detail: L('Tuition waivers, merit scholarships and graduate assistantships.'), url: null },
    ],
    visa: {
      answer: L(
        'For a U.S. F-1 student visa from Nepal you need a Form I-20 from a SEVP-certified school, the SEVIS I-901 fee receipt, a completed DS-160, the visa fee receipt and financial evidence. You then attend an interview at the U.S. Embassy in Kathmandu.',
      ),
      steps: [
        B('Get admitted & receive I-20', 'Apply to SEVP-certified schools, accept an offer and receive your Form I-20.'),
        B('Pay the SEVIS fee', 'Pay the I-901 SEVIS fee and keep the receipt.'),
        B('Complete the DS-160', 'Fill in the online nonimmigrant visa application.'),
        B('Pay & book the interview', 'Pay the visa fee and schedule your interview at the U.S. Embassy Kathmandu.'),
        B('Mock interview practice', 'Prepare clear answers on your study plan, finances and ties to Nepal.'),
        B('Interview & visa', 'Attend the interview; if approved, your passport is returned with the visa.'),
      ],
      total_time: 'P4W',
    },
    documents: [...commonDocs, L('Form I-20'), L('SEVIS I-901 fee receipt'), L('DS-160 confirmation page'), L('Standardised test scores if required (SAT/GRE/GMAT)')],
    work: L(
      'F-1 students may work on campus up to 20 hours per week while classes are in session and full-time during breaks. Off-campus work is only allowed through authorised programmes such as CPT and OPT. TODO: verify current rules.',
    ),
    life: {
      city: 'New York',
      text: L('A global city with endless opportunities, though living costs are high. Many students choose more affordable cities in Texas or the Midwest.'),
      nepali_community: L('Jackson Heights in Queens is home to one of the largest Nepali communities in the USA.'),
    },
    sources: [
      { label: 'U.S. Department of State: Student visa', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html', accessed: ACCESSED },
      { label: 'Study in the States (DHS)', url: 'https://studyinthestates.dhs.gov/', accessed: ACCESSED },
    ],
  },

  'new-zealand': {
    intro: L(
      'Studying in New Zealand from Nepal offers highly ranked universities, a safe and welcoming lifestyle, and post-study work opportunities. You need an offer of place, proof of funds for tuition and living costs, and to apply for a Student Visa online with Immigration New Zealand.',
    ),
    why: [
      B('Quality universities', 'All eight New Zealand universities appear in major world rankings.'),
      B('Safe & welcoming', 'New Zealand is consistently rated one of the safest countries in the world.'),
      B('Post-study work', 'Eligible graduates can apply for a post-study work visa.'),
      B('Practical learning', 'Polytechnic and university programmes focus on job-ready skills.'),
    ],
    costs: {
      answer: L(
        'International tuition in New Zealand generally ranges from about NZD 22,000 to 45,000 per year, and Immigration New Zealand requires evidence of living funds for each year of study in addition to tuition.',
      ),
      tuition: [
        { level: L('Undergraduate'), range: L('NZD 22,000 – 35,000 / year') },
        { level: L('Postgraduate'), range: L('NZD 26,000 – 45,000 / year') },
      ],
      living: [
        { item: L('Accommodation'), amount: L('NZD 800 – 1,500 / month') },
        { item: L('Food & groceries'), amount: L('NZD 300 – 500 / month') },
        { item: L('Transport'), amount: L('NZD 100 – 200 / month') },
      ],
      note: L('TODO: verify the current INZ living-funds requirement.'),
    },
    courses: [L('Information Technology'), L('Business'), L('Engineering'), L('Health Sciences'), L('Agriculture & Environmental Science')],
    universities: [
      { name: 'University of Auckland', city: 'Auckland', url: null },
      { name: 'Auckland University of Technology', city: 'Auckland', url: null },
      { name: 'University of Canterbury', city: 'Christchurch', url: null },
      { name: 'Massey University', city: 'Palmerston North', url: null },
      { name: 'University of Waikato', city: 'Hamilton', url: null },
    ],
    scholarships: [
      { name: 'Manaaki New Zealand Scholarships', detail: L('Government scholarships for eligible countries (check Nepal eligibility).'), url: 'https://www.nzscholarships.govt.nz/' },
      { name: 'University international scholarships', detail: L('Partial tuition scholarships for high-achieving students.'), url: null },
    ],
    visa: {
      answer: L(
        'For a New Zealand Student Visa from Nepal you need an offer of place from an approved institution, evidence of funds or a sponsor, medical and police certificates if required, and an online application through Immigration New Zealand.',
      ),
      steps: [
        B('Offer of place', 'Receive an offer from an approved education provider.'),
        B('Pay tuition', 'Pay tuition (or the required portion) and receive the receipt.'),
        B('Prepare funds & medicals', 'Gather financial evidence and complete medical checks if required.'),
        B('Apply online', 'Submit your Student Visa application and pay the fee.'),
        B('Decision', 'Receive your eVisa and plan your arrival.'),
      ],
      total_time: 'P6W',
    },
    documents: [...commonDocs, L('Offer of place'), L('Tuition fee receipt'), L('Medical certificate and police certificate if required')],
    work: L(
      'Most students on eligible courses can work part-time during the academic year and full-time during scheduled holidays. The exact hours are listed on your visa conditions. TODO: verify the current limit with Immigration New Zealand.',
    ),
    life: {
      city: 'Auckland',
      text: L('New Zealand’s largest city, surrounded by harbours and nature, with the most job and internship options.'),
      nepali_community: L('Auckland has an active Nepali community with cultural associations and festival celebrations.'),
    },
    sources: [
      { label: 'Immigration New Zealand: Student Visa', url: 'https://www.immigration.govt.nz/', accessed: ACCESSED },
      { label: 'Study with New Zealand', url: 'https://www.studywithnewzealand.govt.nz/', accessed: ACCESSED },
    ],
  },

  cyprus: {
    intro: L(
      'Studying in Cyprus from Nepal offers an affordable, English-taught European education in a sunny Mediterranean setting. Your university usually arranges the entry permit through the Civil Registry and Migration Department, and you complete residence registration after arriving.',
    ),
    why: [
      B('Affordable tuition', 'Tuition and living costs are lower than in many other European destinations.'),
      B('English-taught degrees', 'Many programmes at private universities are taught fully in English.'),
      B('European experience', 'Cyprus is an EU member state with a relaxed, safe lifestyle.'),
    ],
    costs: {
      answer: L(
        'Tuition at private universities in Cyprus typically ranges from about EUR 3,500 to 12,000 per year, and living costs are roughly EUR 600–900 per month depending on the city and accommodation.',
      ),
      tuition: [
        { level: L('Undergraduate'), range: L('EUR 3,500 – 10,000 / year') },
        { level: L('Postgraduate'), range: L('EUR 5,000 – 12,000 / year') },
      ],
      living: [
        { item: L('Accommodation'), amount: L('EUR 300 – 550 / month') },
        { item: L('Food & transport'), amount: L('EUR 250 – 400 / month') },
      ],
      note: L('TODO: verify current figures with partner institutions.'),
    },
    courses: [L('Business & Hospitality'), L('Computer Science'), L('Nursing'), L('Tourism Management')],
    universities: [
      { name: 'University of Nicosia', city: 'Nicosia', url: null },
      { name: 'European University Cyprus', city: 'Nicosia', url: null },
      { name: 'Frederick University', city: 'Nicosia / Limassol', url: null },
    ],
    scholarships: [{ name: 'University tuition discounts', detail: L('Private universities often offer partial scholarships to international students.'), url: null }],
    visa: {
      answer: L(
        'To study in Cyprus from Nepal you first secure admission; the university then applies for your entry permit with the Civil Registry and Migration Department. After the permit is issued you obtain your visa, travel, and register for a temporary residence permit as a student.',
      ),
      steps: [
        B('Admission', 'Apply and receive your acceptance letter.'),
        B('Pay deposit & submit documents', 'The university submits your entry-permit application.'),
        B('Entry permit & visa', 'Once approved, obtain your entry visa.'),
        B('Arrive & register', 'Complete residence-permit registration after arrival.'),
      ],
      total_time: 'P8W',
    },
    documents: [...commonDocs, L('Medical certificate'), L('Police clearance certificate')],
    work: L('International students may be allowed limited part-time work in specific sectors under Cyprus rules. TODO: verify current conditions with the Department of Labour.'),
    life: {
      city: 'Nicosia',
      text: L('The capital combines a historic old town with modern student life and easy access to beaches.'),
      nepali_community: L('A small but growing Nepali student community lives in Nicosia and Limassol.'),
    },
    sources: [
      { label: 'Civil Registry and Migration Department, Cyprus', url: 'https://www.moi.gov.cy/moi/crmd/crmd.nsf/home_en/home_en', accessed: ACCESSED },
    ],
  },

  japan: {
    intro: L(
      'Studying in Japan from Nepal usually starts at a Japanese language school, followed by vocational college or university. The school applies for your Certificate of Eligibility (COE) with Japanese immigration, and you then apply for a student visa at the Embassy of Japan in Kathmandu.',
    ),
    why: [
      B('Technology & innovation', 'Study in one of the world’s most advanced economies.'),
      B('Language-school pathway', 'Start with Japanese language study and progress to college or university.'),
      B('Part-time work', 'Students with permission can work part-time to support living costs.'),
      B('Scholarships', 'MEXT and JASSO scholarships support international students.'),
    ],
    costs: {
      answer: L(
        'A year at a Japanese language school typically costs about JPY 700,000 to 900,000 in tuition, and living costs range from roughly JPY 80,000 to 120,000 per month depending on the city, with Tokyo being the most expensive.',
      ),
      tuition: [
        { level: L('Language school'), range: L('JPY 700,000 – 900,000 / year') },
        { level: L('National university'), range: L('Around JPY 535,800 / year (standard)') },
        { level: L('Private university'), range: L('JPY 800,000 – 1,500,000 / year') },
      ],
      living: [
        { item: L('Accommodation'), amount: L('JPY 35,000 – 70,000 / month') },
        { item: L('Food'), amount: L('JPY 30,000 – 45,000 / month') },
        { item: L('National health insurance'), amount: L('Required for residents') },
      ],
      note: L('TODO: verify current tuition with partner schools.'),
    },
    courses: [L('Japanese Language'), L('Information Technology'), L('Business'), L('Hospitality & Tourism'), L('Engineering')],
    universities: [
      { name: 'Japanese language schools (Tokyo, Osaka, Fukuoka)', city: 'Various', url: null },
      { name: 'Ritsumeikan Asia Pacific University', city: 'Beppu', url: null },
      { name: 'Waseda University', city: 'Tokyo', url: null },
    ],
    scholarships: [
      { name: 'MEXT (Monbukagakusho) Scholarship', detail: L('Japanese Government scholarship covering tuition, travel and a monthly allowance.'), url: 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/' },
      { name: 'JASSO Honors Scholarship', detail: L('Monthly stipend for privately financed international students.'), url: null },
    ],
    visa: {
      answer: L(
        'To get a Japanese student visa from Nepal, your school first applies to immigration for your Certificate of Eligibility using your documents and Japanese-language proof (such as JLPT or NAT). Once the COE is issued, you apply for the visa at the Embassy of Japan in Kathmandu.',
      ),
      steps: [
        B('Learn basic Japanese', 'Reach the level your school requires (often JLPT/NAT N5) and keep proof of study hours.'),
        B('Apply to a school', 'Submit documents and sponsor financial proof to the language school.'),
        B('Certificate of Eligibility', 'The school applies for your COE with the Immigration Services Agency.'),
        B('Pay tuition', 'Pay the first-year tuition once the COE is issued.'),
        B('Embassy visa application', 'Apply for the student visa at the Embassy of Japan in Kathmandu.'),
        B('Travel & register', 'Arrive and register your address and health insurance.'),
      ],
      total_time: 'P12W',
    },
    documents: [...commonDocs, L('Japanese language certificate (JLPT/NAT) and study-hours certificate'), L('Sponsor relationship and income documents')],
    work: L(
      'Yes, with "Permission to Engage in Activity Other Than That Permitted" students can usually work up to 28 hours per week during term and longer during long vacations. TODO: verify current rules.',
    ),
    life: {
      city: 'Tokyo',
      text: L('A safe, efficient megacity with plenty of part-time work and a rich culture to explore.'),
      nepali_community: L('Tokyo has a large Nepali community, with Nepali restaurants and shops in areas such as Shin-Okubo.'),
    },
    sources: [
      { label: 'JASSO: Study in Japan', url: 'https://www.studyinjapan.go.jp/en/', accessed: ACCESSED },
      { label: 'Ministry of Foreign Affairs of Japan: Visas', url: 'https://www.mofa.go.jp/j_info/visit/visa/index.html', accessed: ACCESSED },
    ],
  },
};
