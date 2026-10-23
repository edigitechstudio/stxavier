import type { Feature, HomeContent, Partner, Testimonial } from '@/types/content';
import { storyExtras } from './trust';

const unsplash = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Homepage copy + imagery. Editable in Supabase (`page_content`, id "home") once seeded. */
export const homeContent: HomeContent = {
  hero: {
    // The tag keeps the search phrase ("study abroad consultancy … Kathmandu") visible above the fold.
    tag: { en: 'Study Abroad Consultancy · Kathmandu', ne: 'विदेश अध्ययन परामर्श · काठमाडौं' },
    // Brand tagline as the headline; the highlight renders on its own line in gold italic.
    title: { en: 'One place. Many destinations.', ne: 'ठाउँ एक, गन्तव्य अनेक' },
    highlight: { en: 'Many destinations.', ne: 'गन्तव्य अनेक' },
    subtitle: {
      en: 'Admissions, test prep and visas — expert guidance since 2012.',
      ne: 'भर्ना, परीक्षा तयारी र भिसा — सन् २०१२ देखि विज्ञ मार्गदर्शन।',
    },
    image: unsplash('1523240795612-9a054b0db644', 2000),
    primary_cta: { en: 'Get Started', ne: 'सुरु गर्नुहोस्' },
    secondary_cta: { en: 'Free Counselling', ne: 'निःशुल्क परामर्श' },
    // Hero route animation, left to right. Icons: counselling, test-prep, application, visa, departure, success,
    // trophy, career, school, home.
    journey: [
      { icon: 'counselling', title: { en: 'First visit', ne: 'पहिलो भेट' }, note: { en: 'Free counselling', ne: 'निःशुल्क परामर्श' } },
      { icon: 'test-prep', title: { en: 'Test prep', ne: 'परीक्षा तयारी' }, note: { en: 'IELTS · PTE · TOEFL', ne: 'IELTS · PTE · TOEFL' } },
      { icon: 'application', title: { en: 'Applications', ne: 'आवेदन' }, note: { en: 'Offer letter', ne: 'अफर लेटर' } },
      { icon: 'visa', title: { en: 'Visa', ne: 'भिसा' }, note: { en: 'Interview-ready', ne: 'अन्तर्वार्ताको तयारी' } },
      { icon: 'departure', title: { en: 'Departure', ne: 'प्रस्थान' }, note: { en: 'Pre-departure briefing', ne: 'प्रस्थानपूर्व जानकारी' } },
      { icon: 'success', title: { en: 'Success abroad', ne: 'विदेशमा सफलता' }, note: { en: 'Graduate & build a career', ne: 'स्नातक र करियर' } },
    ],
  },
  search: {
    fields: [
      { en: 'Business & Management', ne: 'व्यवसाय र व्यवस्थापन' },
      { en: 'Computer Science & IT', ne: 'कम्प्युटर विज्ञान र IT' },
      { en: 'Engineering', ne: 'इन्जिनियरिङ' },
      { en: 'Health & Nursing', ne: 'स्वास्थ्य र नर्सिङ' },
      { en: 'Hospitality & Tourism', ne: 'होटल व्यवस्थापन र पर्यटन' },
      { en: 'Data Science & AI', ne: 'डाटा साइन्स र AI' },
      { en: 'Arts & Humanities', ne: 'कला र मानविकी' },
    ],
    intakes: [
      { en: 'January 2027', ne: 'जनवरी २०२७' },
      { en: 'May 2027', ne: 'मे २०२७' },
      { en: 'September 2027', ne: 'सेप्टेम्बर २०२७' },
      { en: 'January 2028', ne: 'जनवरी २०२८' },
    ],
  },
  intro: {
    title: { en: 'Your Trusted Study Abroad Partner', ne: 'तपाईंको विश्वसनीय विदेश अध्ययन साझेदार' },
    highlight: { en: 'Study Abroad', ne: 'विदेश अध्ययन' },
    body: {
      en: 'St. Xavier Educational Network helps students plan, apply, and succeed in their study abroad journey. Our consultants guide you through university selection, admissions, test preparation, scholarships, visa processing, and post-arrival support.',
      ne: 'सेन्ट जेभियर एजुकेशनल नेटवर्कले विद्यार्थीलाई विदेश अध्ययनको योजना, आवेदन र सफलतामा सहयोग गर्छ। हाम्रा परामर्शदाताले विश्वविद्यालय छनोट, भर्ना, परीक्षा तयारी, छात्रवृत्ति, भिसा प्रक्रिया र पुगेपछिको सहयोगमा मार्गदर्शन गर्छन्।',
    },
  },
  services: { eyebrow: { en: 'Student Services', ne: 'विद्यार्थी सेवा' }, title: { en: 'Wide Range of Services', ne: 'विस्तृत सेवाहरू' }, subtitle: null },
  comprehensive: {
    title: { en: 'Comprehensive Study Abroad Services', ne: 'सम्पूर्ण विदेश अध्ययन सेवा' },
    body: {
      en: 'From choosing the right country to securing your student visa, we offer end-to-end study abroad support. Our counsellors help with university search, test prep, documentation and interview preparation so students feel confident at every step.',
      ne: 'सही देश छनोटदेखि विद्यार्थी भिसासम्म हामी सम्पूर्ण सहयोग गर्छौं। विश्वविद्यालय खोजी, परीक्षा तयारी, कागजात र अन्तर्वार्ता तयारीमा हाम्रा परामर्शदाताले सहयोग गर्छन्।',
    },
    chips: [
      { en: 'University Search', ne: 'विश्वविद्यालय खोजी' },
      { en: 'Test Preparation', ne: 'परीक्षा तयारी' },
      { en: 'Documentation', ne: 'कागजात' },
      { en: 'Interview Prep', ne: 'अन्तर्वार्ता तयारी' },
      { en: 'Visa Support', ne: 'भिसा सहयोग' },
    ],
    cta: { en: 'Talk to an Expert', ne: 'विज्ञसँग कुरा गर्नुहोस्' },
  },
  destinations: {
    eyebrow: { en: 'Explore Destinations', ne: 'गन्तव्य हेर्नुहोस्' },
    title: { en: 'Where will your degree take you?', ne: 'तपाईंको डिग्रीले तपाईंलाई कहाँ पुर्‍याउँछ?' },
    subtitle: { en: 'Tap a country on the map to discover what studying there looks like.', ne: 'त्यहाँ अध्ययन कस्तो हुन्छ भनेर जान्न नक्सामा देश छान्नुहोस्।' },
  },
  edge: { eyebrow: { en: 'The St. Xavier Edge', ne: 'सेन्ट जेभियरको विशेषता' }, title: { en: 'Built on years of trust', ne: 'वर्षौंको विश्वासमा आधारित' }, subtitle: null },
  why: {
    eyebrow: { en: 'Why Choose Us', ne: 'हामीलाई किन छान्ने' },
    title: { en: 'Why Choose St. Xavier as Your Study Abroad Consultancy?', ne: 'विदेश अध्ययन परामर्शका लागि सेन्ट जेभियर नै किन?' },
    subtitle: { en: 'With years of experience and a proven track record, we support you at every step of your study abroad journey.', ne: 'वर्षौंको अनुभव र प्रमाणित उपलब्धिसहित हामी तपाईंको विदेश अध्ययन यात्राको हरेक चरणमा साथ दिन्छौं।' },
  },
  stories: { eyebrow: { en: 'Students Experiences', ne: 'विद्यार्थीका अनुभव' }, title: { en: 'Our students recount their experiences', ne: 'हाम्रा विद्यार्थी आफ्नो अनुभव सुनाउँछन्' }, subtitle: null },
  process: {
    eyebrow: { en: 'How We Help You', ne: 'हामी कसरी सहयोग गर्छौं' },
    title: { en: 'How Our Study Abroad Consultancy Works', ne: 'हाम्रो विदेश अध्ययन परामर्श कसरी काम गर्छ' },
    subtitle: { en: "We make the study abroad process simple and structured. Here's how we support you step by step.", ne: 'हामी विदेश अध्ययन प्रक्रियालाई सरल र व्यवस्थित बनाउँछौं। चरणबद्ध रूपमा यसरी सहयोग गर्छौं।' },
    cta: { en: 'Get Started Today', ne: 'आजै सुरु गर्नुहोस्' },
  },
  testimonials: { eyebrow: { en: 'Our Testimonial', ne: 'प्रशंसापत्र' }, title: { en: 'What students say about our study abroad consultancy', ne: 'हाम्रो परामर्शबारे विद्यार्थी के भन्छन्' }, subtitle: null },
  cta_banner: {
    title: { en: 'There’s a University waiting to fulfil your study goals', ne: 'तपाईंको अध्ययन लक्ष्य पूरा गर्न एउटा विश्वविद्यालय पर्खिरहेको छ' },
    highlight: { en: 'fulfil your study goals', ne: 'अध्ययन लक्ष्य पूरा गर्न' },
    body: { en: 'Get expert advice on choosing institutions, the admissions process, scholarships, visas and more.', ne: 'संस्था छनोट, भर्ना प्रक्रिया, छात्रवृत्ति, भिसा र अन्य विषयमा विज्ञ सल्लाह लिनुहोस्।' },
    cta: { en: 'Get Consultant Now', ne: 'अहिले परामर्श लिनुहोस्' },
    image: unsplash('1541339907198-e08756dedf3f', 1800),
  },
  essentials: { eyebrow: { en: 'Essential Services', ne: 'आवश्यक सेवा' }, title: { en: 'Get The Lowest Rate', ne: 'सबैभन्दा कम दरमा' }, subtitle: null },
  partners: {
    eyebrow: null,
    title: { en: 'Our University Partners', ne: 'हाम्रा साझेदार विश्वविद्यालय' },
    subtitle: { en: 'Trusted by leading institutions worldwide', ne: 'विश्वभरका अग्रणी संस्थाको भरोसा' },
    cta: { en: 'View All Partners', ne: 'सबै साझेदार हेर्नुहोस्' },
  },
  faq: {
    eyebrow: { en: 'Frequently Asked Questions', ne: 'बारम्बार सोधिने प्रश्न' },
    title: { en: 'Have Questions? We Have Answers', ne: 'प्रश्न छन्? हामीसँग उत्तर छ' },
    subtitle: { en: 'Answers to common questions about studying abroad and our services.', ne: 'विदेश अध्ययन र हाम्रा सेवाबारे सामान्य प्रश्नका उत्तर।' },
    image: unsplash('1522202176988-66273c2fd55f', 900),
    aside_title: { en: 'Still have questions?', ne: 'अझै प्रश्न छन्?' },
    aside_body: { en: 'Our counsellors reply within one working day.', ne: 'हाम्रा परामर्शदाता एक कार्यदिनभित्र जवाफ दिन्छन्।' },
  },
  tools: {
    eyebrow: { en: 'Free Tools', ne: 'निःशुल्क उपकरण' },
    title: { en: 'Plan your study abroad journey in minutes', ne: 'केही मिनेटमै विदेश अध्ययनको योजना बनाउनुहोस्' },
    subtitle: { en: 'Check eligibility, estimate costs and find scholarships — free.', ne: 'योग्यता जाँच, खर्च अनुमान र छात्रवृत्ति खोजी — निःशुल्क।' },
  },
  team: {
    eyebrow: { en: 'Our Counsellors', ne: 'हाम्रा परामर्शदाता' },
    title: { en: 'Guidance from people who’ve done it', ne: 'अनुभवीहरूबाट मार्गदर्शन' },
    subtitle: null,
    cta: { en: 'Meet the team', ne: 'टोलीसँग भेट्नुहोस्' },
  },
  events: {
    eyebrow: { en: 'Events & Webinars', ne: 'कार्यक्रम र वेबिनार' },
    title: { en: 'Meet universities and our counsellors', ne: 'विश्वविद्यालय र परामर्शदातासँग भेट्नुहोस्' },
    subtitle: null,
    cta: { en: 'All events', ne: 'सबै कार्यक्रम' },
  },
  countdown: {
    title: { en: 'Applications are closing soon', ne: 'आवेदन चाँडै बन्द हुँदैछ' },
    body: { en: 'Start now to secure your offer, funds and visa in time.', ne: 'समयमै अफर, आर्थिक कागजात र भिसाका लागि अहिले सुरु गर्नुहोस्।' },
    cta: { en: 'Book Free Counselling', ne: 'निःशुल्क परामर्श बुक गर्नुहोस्' },
  },
};

const f = (
  group: Feature['group'],
  id: string,
  icon: string,
  title: [string, string],
  text: [string, string],
  sort: number,
  label?: [string, string],
): Feature => ({
  id, group, icon, sort, published: true, href: null,
  title: { en: title[0], ne: title[1] },
  text: { en: text[0], ne: text[1] },
  label: label ? { en: label[0], ne: label[1] } : null,
});

// TODO: confirm every claim below (offices, certifications, track record) with the client.
export const features: Feature[] = [
  f('edge', 'edge-global', 'Globe2', ['Global Company', 'विश्वव्यापी कम्पनी'], ['Serving students across Nepal since 2012', 'सन् २०१२ देखि देशभरका विद्यार्थीको सेवामा'], 0),
  f('edge', 'edge-team', 'Users', ['Exposure of our Team', 'हाम्रो टोलीको अनुभव'], ['Trained, certified & widely travelled counsellors', 'तालिमप्राप्त, प्रमाणित र अनुभवी परामर्शदाता'], 1),
  f('edge', 'edge-cert', 'Award', ['Certifications', 'प्रमाणपत्र'], ['Recognised by leading education bodies', 'अग्रणी शैक्षिक निकायबाट मान्यता'], 2),
  f('edge', 'edge-infra', 'Building2', ['Location & Infra', 'स्थान र पूर्वाधार'], ['Smart classrooms, library & mock test centre', 'स्मार्ट कक्षा, पुस्तकालय र मक टेस्ट केन्द्र'], 3),
  f('edge', 'edge-legacy', 'Landmark', ['Legacy', 'विरासत'], ['A proven track record since 2012', 'सन् २०१२ देखिको प्रमाणित उपलब्धि'], 4),
  f('edge', 'edge-onestop', 'Layers', ['One-stop Solution', 'एकै ठाउँमा समाधान'], ['Test prep, admissions, visa & accommodation', 'परीक्षा तयारी, भर्ना, भिसा र आवास'], 5),
  f('edge', 'edge-visa', 'BadgeCheck', ['Visa Success Rate', 'भिसा सफलता दर'], ['Strong results across all destinations', 'सबै गन्तव्यमा उत्कृष्ट नतिजा'], 6),
  f('edge', 'edge-leadership', 'Compass', ['Visionary Leadership', 'दूरदर्शी नेतृत्व'], ['Led by educators & international alumni', 'शिक्षाविद् र अन्तर्राष्ट्रिय पूर्वविद्यार्थीको नेतृत्व'], 7),

  f('why', 'why-guidance', 'Target', ['Expert Guidance for All Programs', 'सबै कार्यक्रमका लागि विज्ञ मार्गदर्शन'], ['Support for undergraduate, graduate and professional programs tailored to your academic profile.', 'तपाईंको शैक्षिक प्रोफाइलअनुसार स्नातक, स्नातकोत्तर र व्यावसायिक कार्यक्रममा सहयोग।'], 0),
  f('why', 'why-network', 'Globe', ['Global University Network', 'विश्वव्यापी विश्वविद्यालय सञ्जाल'], ['Access to universities in the UK, Australia, Canada, USA, New Zealand, Cyprus and Japan.', 'बेलायत, अष्ट्रेलिया, क्यानडा, अमेरिका, न्युजिल्याण्ड, साइप्रस र जापानका विश्वविद्यालयमा पहुँच।'], 1),
  f('why', 'why-visa', 'FileCheck2', ['Visa & Documentation Expertise', 'भिसा र कागजात विशेषज्ञता'], ['Complete visa counselling and documentation assistance for every destination.', 'हरेक गन्तव्यका लागि सम्पूर्ण भिसा परामर्श र कागजात सहयोग।'], 2),
  f('why', 'why-selection', 'UserCheck', ['Personalized University Selection', 'व्यक्तिगत विश्वविद्यालय छनोट'], ['Shortlisting matched to your academic profile, career goals and budget.', 'तपाईंको प्रोफाइल, करियर लक्ष्य र बजेटअनुसार सर्टलिस्ट।'], 3),
  f('why', 'why-testprep', 'PenLine', ['Comprehensive Test Preparation', 'सम्पूर्ण परीक्षा तयारी'], ['Expert coaching for IELTS, PTE, TOEFL and Japanese language with proven strategies.', 'IELTS, PTE, TOEFL र जापानी भाषाका लागि विज्ञ प्रशिक्षण।'], 4),
  f('why', 'why-scholarship', 'Wallet', ['Scholarship & Financial Support', 'छात्रवृत्ति र आर्थिक सहयोग'], ['Guidance on scholarships, education loans and financial planning.', 'छात्रवृत्ति, शैक्षिक ऋण र आर्थिक योजनामा मार्गदर्शन।'], 5),
  f('why', 'why-arrival', 'Plane', ['Post-Arrival Assistance', 'पुगेपछिको सहयोग'], ['Help with accommodation, airport pickup, orientation and settling in.', 'आवास, एयरपोर्ट पिकअप, अभिमुखीकरण र बसोबासमा सहयोग।'], 6),

  f('process', 'step-1', 'MessageCircle', ['Free Counselling Session', 'निःशुल्क परामर्श सत्र'], ['We understand your goals, background and preferences to create a personalised roadmap.', 'तपाईंको लक्ष्य, पृष्ठभूमि र रुचि बुझेर व्यक्तिगत योजना बनाउँछौं।'], 0, ['Step 1', 'चरण १']),
  f('process', 'step-2', 'ListChecks', ['University Shortlisting', 'विश्वविद्यालय सर्टलिस्ट'], ['We match your profile with suitable universities and countries for your budget and career goals.', 'तपाईंको बजेट र करियर लक्ष्यअनुसार उपयुक्त विश्वविद्यालय र देश मिलाउँछौं।'], 1, ['Step 2', 'चरण २']),
  f('process', 'step-3', 'FileText', ['Application & Documentation Support', 'आवेदन र कागजात सहयोग'], ['Help with SOPs, LORs, applications and documents to strengthen your application.', 'SOP, LOR, आवेदन र कागजात तयार गर्न सहयोग।'], 2, ['Step 3', 'चरण ३']),
  f('process', 'step-4', 'Stamp', ['Visa & Pre-Departure Guidance', 'भिसा र प्रस्थान-पूर्व मार्गदर्शन'], ['Visa interview practice, document checks and travel support for a smooth transition.', 'भिसा अन्तर्वार्ता अभ्यास, कागजात जाँच र यात्रा सहयोग।'], 3, ['Step 4', 'चरण ४']),

  f('essentials', 'ess-flight', 'Plane', ['Flight', 'उडान'], ['Domestic & international tickets at student fares', 'विद्यार्थी दरमा आन्तरिक र अन्तर्राष्ट्रिय टिकट'], 0),
  f('essentials', 'ess-rooms', 'BedDouble', ['Rooms', 'आवास'], ['Verified student housing at home and abroad', 'स्वदेश र विदेशमा प्रमाणित विद्यार्थी आवास'], 1),
  f('essentials', 'ess-forex', 'ArrowLeftRight', ['Forex', 'विदेशी मुद्रा'], ['Foreign currency at competitive market rates', 'प्रतिस्पर्धी दरमा विदेशी मुद्रा'], 2),
];

// TODO: replace with real students who have given written consent. Sample entries never render in production.
const portrait = (id: string) => unsplash(id, 600);
const baseTestimonials: Testimonial[] = [
  { id: 'story-1', kind: 'story', name: 'Sample Student A', meta: { en: 'University of Melbourne' }, country: 'Australia', image: portrait('1507003211169-0a1dd7228f2d'), quote: { en: 'My counsellor helped me turn a gap year into a strength in my SOP. I received my offer and visa within eight weeks.' }, rating: null, video_url: null, is_placeholder: true, sort: 0, published: true },
  { id: 'story-2', kind: 'story', name: 'Sample Student B', meta: { en: 'University of Toronto' }, country: 'Canada', image: portrait('1494790108377-be9c29b29330'), quote: { en: 'The mock interviews were tougher than the real one — which is exactly why I walked out of my visa interview smiling.' }, rating: null, video_url: null, is_placeholder: true, sort: 1, published: true },
  { id: 'story-3', kind: 'story', name: 'Sample Student C', meta: { en: 'University of Leeds' }, country: 'United Kingdom', image: portrait('1534528741775-53994a69daeb'), quote: { en: 'From IELTS 6.0 to 7.5 in two months. The trainers genuinely care about every student.' }, rating: null, video_url: null, is_placeholder: true, sort: 2, published: true },
  { id: 'story-4', kind: 'story', name: 'Sample Student D', meta: { en: 'Arizona State University' }, country: 'USA', image: portrait('1506794778202-cad84cf45f1d'), quote: { en: 'They found me a scholarship I did not even know existed. That changed what was financially possible for my family.' }, rating: null, video_url: null, is_placeholder: true, sort: 3, published: true },
  { id: 'story-5', kind: 'story', name: 'Sample Student E', meta: { en: 'Japanese Language School, Tokyo' }, country: 'Japan', image: portrait('1544005313-94ddf0286df2'), quote: { en: 'The Japanese language classes prepared me for life in Tokyo, not just the exam.' }, rating: null, video_url: null, is_placeholder: true, sort: 4, published: true },
  { id: 'review-1', kind: 'review', name: 'Sample Reviewer A', meta: { en: 'Master of Nursing · Deakin University' }, country: 'Australia', image: portrait('1438761681033-6461ffad8d80'), quote: { en: 'My counsellor promptly answered all my queries as a student applying for a nursing course. Even during a stressful period, I always felt guided.' }, rating: 5, video_url: null, is_placeholder: true, sort: 0, published: true },
  { id: 'review-2', kind: 'review', name: 'Sample Reviewer B', meta: { en: 'MBA · University of Sydney' }, country: 'Australia', image: portrait('1500648767791-00dcc994a43e'), quote: { en: 'Thank you for such a great opportunity to study abroad. The team was always helpful and kind throughout the process.' }, rating: 5, video_url: null, is_placeholder: true, sort: 1, published: true },
  { id: 'review-3', kind: 'review', name: 'Sample Reviewer C', meta: { en: 'BSc Computing · Coventry University' }, country: 'United Kingdom', image: portrait('1539571696357-5a69c17a67c6'), quote: { en: 'From the first counselling session to the pre-departure briefing, the guidance made everything clear and stress-free.' }, rating: 5, video_url: null, is_placeholder: true, sort: 2, published: true },
  { id: 'review-4', kind: 'review', name: 'Sample Reviewer D', meta: { en: 'MSc Data Science · University of Auckland' }, country: 'New Zealand', image: portrait('1544005313-94ddf0286df2'), quote: { en: 'The PTE classes were focused and practical, and my counsellor took care of the rest. Highly recommended.' }, rating: 5, video_url: null, is_placeholder: true, sort: 3, published: true },
];

export const testimonials: Testimonial[] = baseTestimonials.map((t) => {
  const x = storyExtras[t.id];
  return x ? { ...t, destination: x.destination, university: x.university, intake: x.intake, story: x.story, video_url: x.video_url ?? null } : t;
});

// TODO: list only institutions with a signed partnership, ideally with logos in /public/partners.
export const partners: Partner[] = [
  'University of Toronto', 'Monash University', 'University of Leeds', 'Arizona State University', 'Deakin University',
  'University of Auckland', 'Coventry University', 'RMIT University', 'University of Nicosia', 'Macquarie University',
].map((name, i) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name, logo: null, url: null, country: null, is_placeholder: true, sort: i, published: true,
}));
