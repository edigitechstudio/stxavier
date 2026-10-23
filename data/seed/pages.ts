import type { Counsellor, DocContent, Faq, Localized, PageContentMap } from '@/types/content';
import { bookingSettings, enquiryContent } from './booking';
import { chatContent } from './chat';
import { portalContent } from './portal';
import { toolsConfig } from './tools';

const L = (en: string, ne?: string): Localized => (ne ? { en, ne } : { en });
const unsplash = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

// TODO: replace with the real team (names, photos with consent, experience). Sample profiles never render in production.
export const counsellors: Counsellor[] = [
  {
    slug: 'sample-counsellor-uk', name: 'Sample Counsellor A', role: L('Senior Counsellor — UK & Europe', 'वरिष्ठ परामर्शदाता — बेलायत र युरोप'),
    photo: unsplash('1573496359142-b8d87734a5a2', 600), specializations: [L('UK admissions'), L('Cyprus'), L('Scholarships')],
    languages: ['English', 'Nepali', 'Hindi'], years_experience: 8, destinations: ['uk', 'cyprus'],
    bio: L('Helps students choose the right UK universities, write strong personal statements and prepare for CAS and visa interviews.'),
    featured: true, is_placeholder: true, sort: 0, published: true,
  },
  {
    slug: 'sample-counsellor-australia', name: 'Sample Counsellor B', role: L('Counsellor — Australia & New Zealand', 'परामर्शदाता — अष्ट्रेलिया र न्युजिल्याण्ड'),
    photo: unsplash('1560250097-0b93528c311a', 600), specializations: [L('Australian visas'), L('Genuine Student statements'), L('Nursing pathways')],
    languages: ['English', 'Nepali'], years_experience: 6, destinations: ['australia', 'new-zealand'],
    bio: L('Specialises in Australian and New Zealand applications, from course selection to visa lodgement and pre-departure.'),
    featured: true, is_placeholder: true, sort: 1, published: true,
  },
  {
    slug: 'sample-counsellor-north-america', name: 'Sample Counsellor C', role: L('Counsellor — USA & Canada', 'परामर्शदाता — अमेरिका र क्यानडा'),
    photo: unsplash('1580489944761-15a19d654956', 600), specializations: [L('F-1 visa interviews'), L('Canadian colleges'), L('Assistantships')],
    languages: ['English', 'Nepali'], years_experience: 5, destinations: ['usa', 'canada'],
    bio: L('Guides students through US and Canadian admissions, I-20 and study-permit documentation, and visa interview practice.'),
    featured: true, is_placeholder: true, sort: 2, published: true,
  },
  {
    slug: 'sample-counsellor-japan', name: 'Sample Counsellor D', role: L('Counsellor — Japan', 'परामर्शदाता — जापान'),
    photo: unsplash('1519085360753-af0119f7cbe7', 600), specializations: [L('Japanese language schools'), L('COE documentation')],
    languages: ['Japanese', 'English', 'Nepali'], years_experience: 7, destinations: ['japan'],
    bio: L('Supports Japan-bound students with school selection, COE documents and Japanese interview preparation.'),
    featured: true, is_placeholder: true, sort: 3, published: true,
  },
];

const doc = (title: string, intro: string, sections: [string, string[]][]): DocContent => ({
  title: L(title),
  intro: L(intro),
  sections: sections.map(([heading, body]) => ({ heading: L(heading), body: body.map((b) => L(b)) })),
  updated: '2026-10-15',
  needs_review: true, // TODO: legal review before launch
});

export const pages: Omit<PageContentMap, 'home'> = {
  tools: toolsConfig,
  booking: bookingSettings,
  enquiry: enquiryContent,
  portal: portalContent,
  chat: chatContent,
  about: {
    hero: {
      eyebrow: L('About Us', 'हाम्रोबारे'),
      title: L('Guiding Nepali students since 2012', 'सन् २०१२ देखि नेपाली विद्यार्थीको मार्गदर्शन'),
      highlight: L('since 2012', 'सन् २०१२ देखि'),
      subtitle: L('One place, many destinations — honest advice and end-to-end support.', 'ठाउँ एक, गन्तव्य अनेक — इमानदार सल्लाह र सम्पूर्ण सहयोग।'),
      image: unsplash('1524178232363-1fb2b075b655'),
    },
    story: {
      title: L('Who is St. Xavier Educational Network?', 'सेन्ट जेभियर एजुकेशनल नेटवर्क को हो?'),
      body: [
        L('St. Xavier Educational Network Pvt. Ltd. is a study abroad consultancy in Kathmandu, Nepal, founded in 2012. We help students choose the right country, course and university, prepare for English and Japanese language tests, secure scholarships and complete visa applications.'),
        L('Our tagline, “ठाउँ एक, गन्तव्य अनेक” (one place, many destinations), reflects what we do: one trusted team supporting students to the UK, Australia, Canada, the USA, New Zealand, Cyprus and Japan.'),
      ],
    },
    mission: L('To give every student honest, personalised guidance so they can study abroad with confidence.', 'हरेक विद्यार्थीलाई इमानदार र व्यक्तिगत मार्गदर्शन दिई आत्मविश्वासका साथ विदेश अध्ययन गर्न सक्षम बनाउनु।'),
    vision: L('To be Nepal’s most trusted partner for international education.', 'अन्तर्राष्ट्रिय शिक्षाका लागि नेपालकै सबैभन्दा भरपर्दो साझेदार बन्नु।'),
    values: [
      { title: L('Honesty', 'इमानदारी'), text: L('We recommend what is right for you, not what is easiest to sell.') },
      { title: L('Care', 'हेरचाह'), text: L('Every student and family gets time, patience and follow-up.') },
      { title: L('Expertise', 'विशेषज्ञता'), text: L('Trained counsellors who stay current with visa and admission rules.') },
      { title: L('Transparency', 'पारदर्शिता'), text: L('Clear fees and clear timelines, explained in writing.') },
    ],
    // TODO: replace with the consultancy's real milestones.
    milestones: [
      { year: '2012', text: L('St. Xavier Educational Network founded in Kathmandu.') },
      { year: 'TODO', text: L('Test preparation centre opened.') },
      { year: 'TODO', text: L('Expanded to Japan and Cyprus destinations.') },
      { year: '2026', text: L('Launched online tools and the student portal.') },
    ],
  },
  'for-parents': {
    hero: {
      eyebrow: L('For Parents', 'अभिभावकका लागि'),
      title: L('Your child’s future, in safe hands', 'तपाईंको सन्तानको भविष्य, सुरक्षित हातमा'),
      highlight: L('in safe hands', 'सुरक्षित हातमा'),
      subtitle: L('Clear answers on safety, total costs, loans and the support we give before and after departure.', 'सुरक्षा, कुल खर्च, ऋण र प्रस्थान अघि–पछिको सहयोगबारे स्पष्ट जानकारी।'),
      image: unsplash('1511632765486-a01980e01a18'),
    },
    intro: L(
      'Sending a son or daughter abroad is a big decision. We involve parents at every step — from choosing a safe, reputable institution to planning finances and staying in touch after arrival.',
      'छोरा वा छोरीलाई विदेश पठाउनु ठूलो निर्णय हो। सुरक्षित र प्रतिष्ठित संस्था छनोटदेखि आर्थिक योजना र पुगेपछि सम्पर्कमा रहनेसम्म हामी अभिभावकलाई हरेक चरणमा समावेश गर्छौं।',
    ),
    sections: [
      { icon: 'ShieldCheck', title: L('Safety first', 'सुरक्षा पहिलो'), text: L('We only recommend registered institutions and help arrange verified accommodation and airport pickup.', 'हामी दर्ता भएका संस्था मात्र सिफारिस गर्छौं र प्रमाणित आवास तथा एयरपोर्ट पिकअपमा सहयोग गर्छौं।') },
      { icon: 'Wallet', title: L('Total cost, explained', 'कुल खर्च, स्पष्ट'), text: L('We give you a written estimate of tuition, living, visa and travel costs before you commit.', 'प्रतिबद्धता अघि नै शुल्क, बसाइ, भिसा र यात्रा खर्चको लिखित अनुमान दिन्छौं।') },
      { icon: 'Landmark', title: L('Education loans', 'शैक्षिक ऋण'), text: L('We explain education-loan options from Nepali banks and the documents banks require.', 'नेपाली बैंकका शैक्षिक ऋण विकल्प र आवश्यक कागजातबारे बुझाउँछौं।') },
      { icon: 'HeartHandshake', title: L('Support after arrival', 'पुगेपछिको सहयोग'), text: L('Pre-departure briefings, community contacts and follow-up after your child arrives.', 'प्रस्थान-पूर्व ब्रिफिङ, समुदायको सम्पर्क र पुगेपछि फलो-अप।') },
    ],
    cost_example: {
      title: L('Example: first-year budget checklist', 'उदाहरण: पहिलो वर्षको बजेट सूची'),
      note: L('Amounts vary by country and course — we prepare an exact estimate for your child.', 'रकम देश र कोर्सअनुसार फरक हुन्छ — तपाईंको सन्तानका लागि सही अनुमान तयार गर्छौं।'),
      rows: [
        { item: L('Tuition (first year)', 'शुल्क (पहिलो वर्ष)'), amount: L('Depends on institution', 'संस्थाअनुसार') },
        { item: L('Living costs', 'बस्ने खर्च'), amount: L('Set by visa rules', 'भिसा नियमअनुसार') },
        { item: L('Visa fee & health cover', 'भिसा शुल्क र स्वास्थ्य बीमा'), amount: L('Country-specific', 'देशअनुसार') },
        { item: L('Flight & initial setup', 'उडान र सुरुको व्यवस्था'), amount: L('Season-dependent', 'मौसमअनुसार') },
      ],
    },
    form_title: L('Talk to a counsellor as a parent', 'अभिभावकका रूपमा परामर्शदातासँग कुरा गर्नुहोस्'),
  },
  contact: {
    hero: {
      eyebrow: L('Contact', 'सम्पर्क'),
      title: L('Let’s plan your future together', 'सँगै तपाईंको भविष्यको योजना बनाऔं'),
      highlight: L('together', 'सँगै'),
      subtitle: L('Visit our Kathmandu office, call, WhatsApp or send us a message.', 'काठमाडौं कार्यालयमा आउनुहोस्, फोन, WhatsApp वा सन्देश पठाउनुहोस्।'),
      image: null,
    },
    form_title: L('Send us a message', 'हामीलाई सन्देश पठाउनुहोस्'),
    form_intro: L('We reply within one working day.', 'हामी एक कार्यदिनभित्र जवाफ दिन्छौं।'),
  },
  destinations: {
    eyebrow: L('Study Destinations', 'अध्ययन गन्तव्य'),
    title: L('Where do you want to study?', 'तपाईं कहाँ पढ्न चाहनुहुन्छ?'),
    highlight: L('study?', 'पढ्न'),
    subtitle: L('Compare countries on cost, work rights and post-study options.', 'खर्च, काम गर्ने अधिकार र अध्ययनपछिका अवसरका आधारमा देश तुलना गर्नुहोस्।'),
    image: unsplash('1488646953014-85cb44e25828'),
  },
  team: {
    eyebrow: L('Our Team', 'हाम्रो टोली'),
    title: L('Meet our counsellors', 'हाम्रा परामर्शदातासँग भेट्नुहोस्'),
    highlight: L('counsellors', 'परामर्शदाता'),
    subtitle: L('Experienced, certified and focused on your goals.', 'अनुभवी, प्रमाणित र तपाईंको लक्ष्यमा केन्द्रित।'),
    image: null,
  },
  'test-prep': {
    eyebrow: L('Test Preparation', 'परीक्षा तयारी'),
    title: L('IELTS, PTE, TOEFL & Japanese classes in Kathmandu', 'काठमाडौंमा IELTS, PTE, TOEFL र जापानी भाषा कक्षा'),
    highlight: L('in Kathmandu', 'काठमाडौंमा'),
    subtitle: L('Small batches, flexible timings and free mock tests.', 'साना ब्याच, लचिलो समय र निःशुल्क मक टेस्ट।'),
    image: unsplash('1434030216411-0b793f4b4173'),
  },
  services: {
    eyebrow: L('Our Services', 'हाम्रा सेवा'),
    title: L('Everything you need to study abroad', 'विदेश अध्ययनका लागि चाहिने सबै कुरा'),
    highlight: L('study abroad', 'विदेश अध्ययन'),
    subtitle: L('From first counselling to pre-departure.', 'पहिलो परामर्शदेखि प्रस्थान-पूर्व तयारीसम्म।'),
    image: null,
  },
  'privacy-policy': doc('Privacy Policy', 'This policy explains what personal information St. Xavier Educational Network collects through this website and how we use it.', [
    ['Information we collect', ['Details you submit in forms: name, phone number, email address and study preferences.', 'Technical data such as pages visited, collected only after you accept analytics cookies.']],
    ['How we use it', ['To respond to your enquiry and provide counselling services.', 'To send updates you subscribed to; you can unsubscribe at any time.']],
    ['Storage and security', ['Data is stored with our hosting and database providers with access restricted to authorised staff.']],
    ['Your rights', ['You can ask us to access, correct or delete your information by contacting info@stxavier.com.np.']],
  ]),
  terms: doc('Terms of Use', 'These terms govern your use of the St. Xavier Educational Network website.', [
    ['Information on this site', ['Admission, visa and cost information is general guidance and may change. Always confirm details with the official source or a counsellor.']],
    ['Services', ['Counselling services are provided under a separate written agreement that explains any fees.']],
    ['Liability', ['Visa and admission decisions are made by institutions and governments; we cannot guarantee outcomes.']],
  ]),
  'cookie-policy': doc('Cookie Policy', 'This website uses a small number of cookies.', [
    ['Essential', ['Remember your language, theme and cookie choice. These are always on.']],
    ['Analytics & marketing', ['Google Analytics, Meta Pixel and Microsoft Clarity load only if you choose “Accept all”. You can change your choice any time with “Cookie settings” in the footer.']],
  ]),
  'editorial-policy': doc('Editorial Policy', 'How we research, review and update the information on this website.', [
    ['Sources', ['Visa, cost and work-rights information is checked against official government and institution sources, which we link on each page.']],
    ['Review and updates', ['Pages show a “Last updated” date. We review destination pages whenever rules change and at least every six months.']],
    ['Corrections', ['If you find an error, contact info@stxavier.com.np and we will review it promptly.']],
  ]),
};

export const extraFaqs: Faq[] = [
  {
    id: 'parents-safety', scope: 'parents', sort: 0, published: true,
    question: L('How do you make sure my child studies at a safe, genuine institution?', 'मेरो सन्तान सुरक्षित र वास्तविक संस्थामा पढ्छ भन्ने कसरी सुनिश्चित गर्नुहुन्छ?'),
    answer: L('We only recommend institutions that are registered with their country’s government (for example, CRICOS in Australia or licensed sponsors in the UK), and we share the official registration links with families.'),
  },
  {
    id: 'parents-loans', scope: 'parents', sort: 1, published: true,
    question: L('Can we use an education loan from a Nepali bank?', 'के नेपाली बैंकको शैक्षिक ऋण प्रयोग गर्न सकिन्छ?'),
    answer: L('Yes. Many Nepali banks offer education loans for study abroad. Banks usually require the offer letter, collateral and income documents; we help you prepare a file that also meets visa requirements.'),
  },
  {
    id: 'parents-contact', scope: 'parents', sort: 2, published: true,
    question: L('Will we stay in touch after our child leaves Nepal?', 'सन्तान नेपालबाट गएपछि पनि सम्पर्कमा रहन्छौं?'),
    answer: L('Yes. Families can contact their counsellor at any time, and we follow up with students after arrival to make sure they have settled in.'),
  },
  {
    id: 'prep-which-test', scope: 'test-prep', sort: 0, published: true,
    question: L('Should I take IELTS or PTE?', 'IELTS दिने कि PTE?'),
    answer: L('Both are widely accepted. IELTS has a face-to-face speaking test and paper or computer options; PTE is fully computer-based with faster results. Choose the test your university and visa accept, and the format you are most comfortable with — our free mock tests help you decide.'),
  },
  {
    id: 'prep-mock', scope: 'test-prep', sort: 1, published: true,
    question: L('Is the mock test really free?', 'के मक टेस्ट साँच्चै निःशुल्क हो?'),
    answer: L('Yes. Your first full mock test is free, with scores and feedback, so you know your current level before joining a class.'),
  },
];
