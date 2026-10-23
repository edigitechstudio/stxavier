import type { Destination, Faq, KeyFacts, NavItem, Service, TestPrepCourse } from '@/types/content';
import { destinationDetails } from './destination-details';
import { serviceDetails, testPrepDetails } from './course-details';
import { costProfiles, requirements, timelines } from './tools';

const UPDATED = '2026-10-15';

// TODO: every key fact (intakes, work rights…) must be verified against the official government source and dated before launch.
const facts = (f: Partial<Record<keyof KeyFacts, string>>): KeyFacts => ({
  avg_tuition: f.avg_tuition ? { en: f.avg_tuition } : null,
  living_cost: f.living_cost ? { en: f.living_cost } : null,
  work_rights: f.work_rights ? { en: f.work_rights } : null,
  post_study_visa: f.post_study_visa ? { en: f.post_study_visa } : null,
  intakes: f.intakes ? { en: f.intakes } : null,
  visa_processing: f.visa_processing ? { en: f.visa_processing } : null,
  pr_pathway: f.pr_pathway ? { en: f.pr_pathway } : null,
});

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=75`;

type BaseDestination = Omit<Destination, 'details' | 'cost_profile' | 'requirements' | 'timeline'>;
const baseDestinations: BaseDestination[] = [
  {
    slug: 'uk', iso3: 'GBR', iso2: 'GB', lat: 53, lng: -2, sort: 0, published: true, updated_at: UPDATED,
    name: { en: 'United Kingdom', ne: 'बेलायत' },
    summary: { en: 'World-renowned universities, one-year master’s degrees and a post-study Graduate Route visa.', ne: 'विश्वप्रसिद्ध विश्वविद्यालय, एक वर्षे मास्टर्स र अध्ययनपछिको ग्राजुएट रुट भिसा।' },
    hero_image: unsplash('1513635269975-59663e0ac1ad'),
    key_facts: facts({ intakes: 'January, May, September', work_rights: 'Up to 20 hours/week during term (degree level)', post_study_visa: 'Graduate route (check current duration)', visa_processing: 'About 3 weeks', pr_pathway: 'Possible later via skilled work routes' }),
    badge: { en: '160+ universities', ne: '160+ विश्वविद्यालय' }, // TODO: verify count
  },
  {
    slug: 'australia', iso3: 'AUS', iso2: 'AU', lat: -25, lng: 134, sort: 1, published: true, updated_at: UPDATED,
    name: { en: 'Australia', ne: 'अष्ट्रेलिया' },
    summary: { en: 'Group of Eight universities, strong post-study work rights and a large Nepali community.', ne: 'ग्रुप अफ एट विश्वविद्यालय, अध्ययनपछि काम गर्ने अधिकार र ठूलो नेपाली समुदाय।' },
    hero_image: unsplash('1506973035872-a4ec16b8e8d9'),
    key_facts: facts({ intakes: 'February, July (some November)', work_rights: 'Limited hours per fortnight in term; unlimited in breaks', post_study_visa: 'Temporary Graduate visa (subclass 485)', visa_processing: 'About 4–6 weeks', pr_pathway: 'Points-tested skilled migration' }),
    badge: { en: '40+ universities', ne: '40+ विश्वविद्यालय' }, // TODO: verify count
  },
  {
    slug: 'canada', iso3: 'CAN', iso2: 'CA', lat: 57, lng: -105, sort: 2, published: true, updated_at: UPDATED,
    name: { en: 'Canada', ne: 'क्यानडा' },
    summary: { en: 'Affordable, welcoming and globally respected, with co-op programs and post-graduation work permits.', ne: 'किफायती, स्वागतयोग्य र विश्वमान्य — को-अप कार्यक्रम र स्नातकोत्तर कार्य अनुमतिसहित।' },
    hero_image: unsplash('1517935706615-2717063c2225'),
    key_facts: facts({ intakes: 'January, May, September', work_rights: 'Part-time off campus in term; full-time in breaks', post_study_visa: 'Post-Graduation Work Permit (up to 3 years)', visa_processing: 'About 8 weeks', pr_pathway: 'Express Entry / Provincial Nominee' }),
    badge: { en: '220+ universities', ne: '220+ विश्वविद्यालय' }, // TODO: verify count
  },
  {
    slug: 'usa', iso3: 'USA', iso2: 'US', lat: 39, lng: -98, sort: 3, published: true, updated_at: UPDATED,
    name: { en: 'United States', ne: 'अमेरिका' },
    summary: { en: 'The world’s largest higher-education system, research funding and OPT work experience.', ne: 'विश्वकै ठूलो उच्च शिक्षा प्रणाली, अनुसन्धान अनुदान र OPT कार्य अनुभव।' },
    hero_image: unsplash('1485871981521-5b1fd3805eee'),
    key_facts: facts({ intakes: 'January (Spring), August/September (Fall)', work_rights: 'On campus up to 20 hours/week in term', post_study_visa: 'OPT 12 months (+24 for STEM)', visa_processing: 'Depends on interview wait', pr_pathway: 'Employer sponsorship only' }),
    badge: { en: '4,000+ universities', ne: '4,000+ विश्वविद्यालय' }, // TODO: verify count
  },
  {
    slug: 'new-zealand', iso3: 'NZL', iso2: 'NZ', lat: -41, lng: 173, sort: 4, published: true, updated_at: UPDATED,
    name: { en: 'New Zealand', ne: 'न्युजिल्याण्ड' },
    summary: { en: 'Highly ranked universities, a safe lifestyle and post-study work visas.', ne: 'उच्च श्रेणीका विश्वविद्यालय, सुरक्षित जीवनशैली र अध्ययनपछिको कार्य भिसा।' },
    hero_image: unsplash('1507699622108-4be3abd695ad'),
    key_facts: facts({ intakes: 'February, July', work_rights: 'Part-time in term; full-time in holidays', post_study_visa: 'Post-study work visa (up to 3 years)', visa_processing: 'About 4–6 weeks', pr_pathway: 'Skilled Migrant Category' }),
    badge: { en: '8 universities', ne: '8 विश्वविद्यालय' }, // TODO: verify count
  },
  {
    slug: 'cyprus', iso3: 'CYP', iso2: 'CY', lat: 35, lng: 33, sort: 5, published: true, updated_at: UPDATED,
    name: { en: 'Cyprus', ne: 'साइप्रस' },
    summary: { en: 'Affordable European education in English with a Mediterranean lifestyle.', ne: 'भूमध्यसागरीय जीवनशैलीसहित अंग्रेजी माध्यममा किफायती युरोपेली शिक्षा।' },
    hero_image: null,
    key_facts: facts({ intakes: 'February, September', work_rights: 'Limited part-time in specific sectors', post_study_visa: 'Limited post-study options', visa_processing: 'About 6–8 weeks', pr_pathway: 'Limited' }),
    badge: null,
  },
  {
    slug: 'japan', iso3: 'JPN', iso2: 'JP', lat: 36, lng: 138, sort: 6, published: true, updated_at: UPDATED,
    name: { en: 'Japan', ne: 'जापान' },
    summary: { en: 'Japanese language schools, cutting-edge universities and part-time work opportunities.', ne: 'जापानी भाषा विद्यालय, अत्याधुनिक विश्वविद्यालय र पार्ट-टाइम कामका अवसर।' },
    hero_image: unsplash('1540959733332-eab4deabeeaf'),
    key_facts: facts({ intakes: 'January, April, July, October (language schools)', work_rights: 'Up to 28 hours/week with permission', post_study_visa: 'Job-hunting (Designated Activities) visa', visa_processing: 'About 2–4 weeks after COE', pr_pathway: 'Long-term residence after years of work' }),
    badge: { en: '780+ universities', ne: '780+ विश्वविद्यालय' }, // TODO: verify count
  },
];

export const destinations: Destination[] = baseDestinations.map((d) => ({
  ...d,
  details: destinationDetails[d.slug] ?? null,
  cost_profile: costProfiles[d.slug] ?? null,
  requirements: requirements[d.slug] ?? null,
  timeline: timelines[d.slug] ?? null,
}));

const baseServices: Omit<Service, 'details'>[] = [
  { slug: 'study-abroad-counselling', icon: 'GraduationCap', sort: 0, published: true, title: { en: 'Study Abroad', ne: 'विदेश अध्ययन' }, summary: { en: 'Start your journey with St. Xavier — expert counselling, honest advice and admissions to universities that fit your goals and budget.', ne: 'सेन्ट जेभियरसँग यात्रा सुरु गर्नुहोस् — विज्ञ परामर्श, इमानदार सल्लाह र तपाईंको लक्ष्य तथा बजेट सुहाउँदो विश्वविद्यालयमा भर्ना।' } },
  { slug: 'mock-test', icon: 'ClipboardCheck', sort: 1, published: true, title: { en: 'Mock Test', ne: 'मक टेस्ट' }, summary: { en: 'Full-length, exam-condition mock tests for IELTS, PTE and TOEFL — with band-level feedback from certified trainers.', ne: 'IELTS, PTE र TOEFL को वास्तविक परीक्षाजस्तै पूर्ण मक टेस्ट — प्रमाणित प्रशिक्षकबाट ब्यान्ड-स्तरको प्रतिक्रियासहित।' } },
  { slug: 'test-preparation', icon: 'BookOpenCheck', sort: 2, published: true, title: { en: 'Test Preparation', ne: 'परीक्षा तयारी' }, summary: { en: 'Structured classes, small batches and personal mentoring designed to lift your score in the shortest possible time.', ne: 'संरचित कक्षा, साना ब्याच र व्यक्तिगत मार्गदर्शन — छोटो समयमै राम्रो अंकका लागि।' } },
  { slug: 'test-registration', icon: 'CalendarCheck', sort: 3, published: true, title: { en: 'Test Registration', ne: 'परीक्षा दर्ता' }, summary: { en: 'We handle official test registration so you get the right date, centre and format — without the paperwork stress.', ne: 'सही मिति, केन्द्र र ढाँचामा आधिकारिक परीक्षा दर्ता — कागजी झन्झटबिना।' } },
];

export const services: Service[] = baseServices.map((x) => ({ ...x, details: serviceDetails[x.slug] ?? null }));

const baseCourses: Omit<TestPrepCourse, 'details'>[] = [
  { slug: 'ielts', icon: 'BookOpenCheck', sort: 0, published: true, name: { en: 'IELTS' }, summary: { en: 'Academic & General Training classes with weekly mock tests.', ne: 'साप्ताहिक मक टेस्टसहित एकेडेमिक र जनरल कक्षा।' } },
  { slug: 'pte', icon: 'MonitorCheck', sort: 1, published: true, name: { en: 'PTE Academic' }, summary: { en: 'Computer-based practice with scored mock tests.', ne: 'कम्प्युटरमा आधारित अभ्यास र अंकसहितको मक टेस्ट।' } },
  { slug: 'toefl', icon: 'ClipboardCheck', sort: 2, published: true, name: { en: 'TOEFL iBT' }, summary: { en: 'Structured preparation for US and Canadian admissions.', ne: 'अमेरिकी र क्यानेडियन भर्नाका लागि संरचित तयारी।' } },
  { slug: 'japanese', icon: 'Languages', sort: 3, published: true, name: { en: 'Japanese Language', ne: 'जापानी भाषा' }, summary: { en: 'JLPT/NAT preparation for Japan-bound students.', ne: 'जापान जाने विद्यार्थीका लागि JLPT/NAT तयारी।' } },
];

export const testPrepCourses: TestPrepCourse[] = baseCourses.map((x) => ({ ...x, details: testPrepDetails[x.slug] ?? null }));

/**
 * Menus. Items with `source` get their children from that collection automatically,
 * so publishing a new destination/service/course adds it to the menu with no code change.
 */
const nav = (
  id: string,
  menu: NavItem['menu'],
  en: string,
  ne: string,
  href: string | null,
  sort: number,
  extra: Partial<NavItem> = {},
): NavItem => ({ id, menu, parent_id: null, label: { en, ne }, description: null, href, icon: null, source: null, sort, ...extra });

const child = (parent_id: string, id: string, en: string, ne: string, href: string, sort: number, icon: string, desc?: [string, string]): NavItem => ({
  id, menu: 'header', parent_id, label: { en, ne }, href, sort, icon, source: null,
  description: desc ? { en: desc[0], ne: desc[1] } : null,
});

export const navItems: NavItem[] = [
  nav('destinations', 'header', 'Destinations', 'गन्तव्य', '/destinations', 0, { source: 'destinations' }),
  nav('services', 'header', 'Services', 'सेवाहरू', '/services', 1, { source: 'services' }),
  nav('test-prep', 'header', 'Test Prep', 'परीक्षा तयारी', '/test-prep', 2, { source: 'test_prep' }),
  nav('tools', 'header', 'Tools', 'उपकरण', '/tools', 3),
  child('tools', 'tool-eligibility', 'Eligibility Checker', 'योग्यता जाँच', '/tools/eligibility-checker', 0, 'ListChecks', ['Find countries and courses that fit you', 'तपाईंलाई मिल्ने देश र कोर्स पत्ता लगाउनुहोस्']),
  child('tools', 'tool-cost', 'Cost Calculator', 'खर्च क्याल्कुलेटर', '/tools/cost-calculator', 1, 'Calculator', ['Tuition + living costs in NPR', 'NPR मा शुल्क र बस्ने खर्च']),
  child('tools', 'tool-scholarship', 'Scholarship Finder', 'छात्रवृत्ति खोजी', '/tools/scholarship-finder', 2, 'Award', ['Scholarships you may qualify for', 'तपाईं योग्य हुन सक्ने छात्रवृत्ति']),
  child('tools', 'tool-ielts', 'IELTS Band Calculator', 'IELTS ब्यान्ड क्याल्कुलेटर', '/tools/ielts-band-calculator', 3, 'Gauge', ['Overall band from section scores', 'खण्डगत अंकबाट समग्र ब्यान्ड']),
  child('tools', 'tool-gpa', 'GPA ↔ Percentage', 'GPA ↔ प्रतिशत', '/tools/gpa-percentage-converter', 4, 'Percent', ['NEB and TU grading scales', 'NEB र TU ग्रेडिङ']),
  child('tools', 'tool-timeline', 'Visa Timeline Planner', 'भिसा समयरेखा', '/tools/visa-timeline-planner', 5, 'CalendarRange', ['Reverse-plan your intake', 'इन्टेकअनुसार योजना']),
  child('tools', 'tool-checklist', 'Document Checklist', 'कागजात सूची', '/tools/document-checklist', 6, 'FileCheck2', ['Exactly what to prepare', 'के-के तयार गर्ने']),
  child('tools', 'tool-compare', 'Country Comparison', 'देश तुलना', '/tools/country-comparison', 7, 'Columns3', ['Compare up to 3 countries', '३ देशसम्म तुलना']),
  child('tools', 'tool-emi', 'Loan EMI Calculator', 'ऋण EMI क्याल्कुलेटर', '/tools/education-loan-emi-calculator', 8, 'Landmark', ['Monthly instalments for education loans', 'शैक्षिक ऋणको मासिक किस्ता']),
  nav('resources', 'header', 'Resources', 'स्रोतहरू', null, 4),
  child('resources', 'res-blog', 'Blog & Guides', 'ब्लग र गाइड', '/blog', 0, 'Newspaper', ['Visa updates, costs and tips', 'भिसा अपडेट, खर्च र सुझाव']),
  child('resources', 'res-success', 'Success Stories', 'सफलताका कथा', '/success-stories', 1, 'Trophy', ['Students we have helped', 'हामीले सहयोग गरेका विद्यार्थी']),
  child('resources', 'res-events', 'Events & Webinars', 'कार्यक्रम र वेबिनार', '/events', 2, 'CalendarDays', ['University visits and info sessions', 'विश्वविद्यालय भ्रमण र जानकारी सत्र']),
  child('resources', 'res-universities', 'University Directory', 'विश्वविद्यालय निर्देशिका', '/universities', 3, 'Building2', ['Search partner universities', 'साझेदार विश्वविद्यालय खोज्नुहोस्']),
  child('resources', 'res-parents', 'For Parents', 'अभिभावकका लागि', '/for-parents', 4, 'HeartHandshake', ['Safety, costs and support', 'सुरक्षा, खर्च र सहयोग']),
  child('resources', 'res-faq', 'FAQ', 'बारम्बार सोधिने प्रश्न', '/faq', 5, 'CircleHelp', ['Quick answers', 'छिटो उत्तर']),
  nav('about', 'header', 'About', 'हाम्रोबारे', '/about', 5),
  child('about', 'about-us', 'Our Story', 'हाम्रो कथा', '/about', 0, 'Landmark', ['Since 2012 in Kathmandu', 'सन् २०१२ देखि काठमाडौंमा']),
  child('about', 'about-team', 'Our Counsellors', 'हाम्रा परामर्शदाता', '/team', 1, 'Users', ['Meet the team', 'टोलीसँग परिचित हुनुहोस्']),
  nav('contact', 'header', 'Contact', 'सम्पर्क', '/contact', 6),

  nav('fq-destinations', 'footer_quick', 'All Destinations', 'सबै गन्तव्य', '/destinations', 0),
  nav('fq-universities', 'footer_quick', 'Universities', 'विश्वविद्यालय', '/universities', 1),
  nav('fq-tools', 'footer_quick', 'Free Tools', 'निःशुल्क उपकरण', '/tools', 2),
  nav('fq-book', 'footer_quick', 'Book Counselling', 'परामर्श बुक गर्नुहोस्', '/book', 3),
  nav('fq-about', 'footer_quick', 'About Us', 'हाम्रोबारे', '/about', 4),
  nav('fq-contact', 'footer_quick', 'Contact', 'सम्पर्क', '/contact', 5),
  nav('fr-blog', 'footer_resources', 'Blog', 'ब्लग', '/blog', 0),
  nav('fr-events', 'footer_resources', 'Events', 'कार्यक्रम', '/events', 1),
  nav('fr-faq', 'footer_resources', 'FAQ', 'प्रश्नोत्तर', '/faq', 2),
  nav('fr-parents', 'footer_resources', 'For Parents', 'अभिभावकका लागि', '/for-parents', 3),
  nav('fr-privacy', 'footer_resources', 'Privacy Policy', 'गोपनीयता नीति', '/privacy-policy', 4),
  nav('fr-terms', 'footer_resources', 'Terms', 'सर्तहरू', '/terms', 5),
];

export const faqs: Faq[] = [
  {
    id: 'general-cost', scope: 'home', sort: 0, published: true,
    question: { en: 'Is the first counselling session free?', ne: 'के पहिलो परामर्श निःशुल्क हो?' },
    answer: { en: 'Yes. Your first counselling session at St. Xavier Educational Network is free, in person at our Kathmandu office, over Zoom or on a WhatsApp call. We explain any service fees in writing before you commit.', ne: 'हो। सेन्ट जेभियरमा पहिलो परामर्श निःशुल्क हो — काठमाडौं कार्यालयमा, Zoom वा WhatsApp कलमार्फत। कुनै शुल्क लाग्ने भए प्रतिबद्धता अघि नै लिखित रूपमा जानकारी दिन्छौं।' },
  },
  {
    id: 'general-countries', scope: 'home', sort: 1, published: true,
    question: { en: 'Which countries can St. Xavier help me apply to?', ne: 'सेन्ट जेभियरले कुन-कुन देशमा आवेदन दिन सहयोग गर्छ?' },
    answer: { en: 'We help students from Nepal apply to universities and colleges in the United Kingdom, Australia, Canada, the United States, New Zealand, Cyprus and Japan, covering admissions, scholarships and the student visa process.', ne: 'हामी नेपालका विद्यार्थीलाई बेलायत, अष्ट्रेलिया, क्यानडा, अमेरिका, न्युजिल्याण्ड, साइप्रस र जापानका विश्वविद्यालय तथा कलेजमा भर्ना, छात्रवृत्ति र भिसा प्रक्रियामा सहयोग गर्छौं।' },
  },
  {
    id: 'general-timeline', scope: 'home', sort: 2, published: true,
    question: { en: 'How early should I start preparing to study abroad?', ne: 'विदेश अध्ययनको तयारी कति अगाडि सुरु गर्नुपर्छ?' },
    answer: { en: 'Start 9–12 months before your intended intake. That leaves time for an English test, university applications, offer letters, financial documents and the visa decision without rushing.', ne: 'चाहेको इन्टेकभन्दा ९–१२ महिना अगाडि सुरु गर्नुहोस्। यसले अंग्रेजी परीक्षा, आवेदन, अफर लेटर, आर्थिक कागजात र भिसाका लागि पर्याप्त समय दिन्छ।' },
  },
  {
    id: 'general-what', scope: 'home', sort: 3, published: true,
    question: { en: 'What does a study abroad consultancy do?', ne: 'विदेश अध्ययन परामर्श संस्थाले के गर्छ?' },
    answer: { en: 'A study abroad consultancy guides you through every stage: choosing a country and course, preparing for English tests, shortlisting universities, writing your SOP, applying, securing scholarships, preparing your visa file and settling in after arrival.', ne: 'यसले हरेक चरणमा मार्गदर्शन गर्छ: देश र कोर्स छनोट, अंग्रेजी परीक्षा तयारी, विश्वविद्यालय सर्टलिस्ट, SOP लेखन, आवेदन, छात्रवृत्ति, भिसा फाइल र पुगेपछि बसोबास।' },
  },
  {
    id: 'general-scholarships', scope: 'home', sort: 4, published: true,
    question: { en: 'Do you help with scholarships and financial planning?', ne: 'के तपाईंहरू छात्रवृत्ति र आर्थिक योजनामा सहयोग गर्नुहुन्छ?' },
    answer: { en: 'Yes. Our counsellors identify merit and need-based scholarships you are eligible for, and help you plan tuition, living costs, education loans and the financial documents required for your visa.', ne: 'हो। हाम्रा परामर्शदाताले तपाईं योग्य हुने छात्रवृत्ति पहिचान गर्छन् र शुल्क, बस्ने खर्च, शैक्षिक ऋण तथा भिसाका लागि आवश्यक आर्थिक कागजातको योजनामा सहयोग गर्छन्।' },
  },
  {
    id: 'general-english-test', scope: 'home', sort: 5, published: true,
    question: { en: 'Do I need IELTS or PTE to study abroad?', ne: 'विदेश पढ्न IELTS वा PTE चाहिन्छ?' },
    answer: { en: 'Most universities require proof of English through IELTS, PTE, TOEFL or Duolingo. Some waive it based on prior English-medium education; for Japan, Japanese language ability (JLPT/NAT) matters instead. We confirm what applies to you.', ne: 'धेरैजसो विश्वविद्यालयले IELTS, PTE, TOEFL वा Duolingo मागछन्। केहीले अंग्रेजी माध्यमको अघिल्लो शिक्षाका आधारमा छुट दिन्छन्; जापानका लागि जापानी भाषा (JLPT/NAT) महत्त्वपूर्ण हुन्छ। तपाईंका लागि के लागू हुन्छ भनेर हामी पुष्टि गर्छौं।' },
  },
];
