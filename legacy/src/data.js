// Central content for the St. Xavier Educational Network landing page.
// Copy, figures and partner names are placeholders — replace with verified data before launch.

export const img = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const brand = {
  name: 'St. Xavier',
  full: 'St. Xavier Educational Network',
  phone: '+977 01-5970000',
  email: 'info@stxaviernetwork.edu.np',
  address: 'Putalisadak, Kathmandu, Nepal',
};

export const navItems = [
  {
    label: 'Services',
    children: [
      { label: 'Study Abroad Counselling', desc: 'One-on-one guidance from shortlist to visa' },
      { label: 'Test Preparation', desc: 'IELTS, PTE, TOEFL, SAT, GRE & GMAT' },
      { label: 'Test Registration', desc: 'Book official test dates hassle-free' },
      { label: 'Visa & Documentation', desc: 'SOPs, financials & interview prep' },
    ],
  },
  {
    label: 'Study Abroad',
    children: [
      { label: 'Study in USA', desc: 'Ivy-league to community colleges' },
      { label: 'Study in UK', desc: '1-year masters & Russell Group' },
      { label: 'Study in Canada', desc: 'Co-op programs & PR pathways' },
      { label: 'Study in Australia', desc: 'Group of Eight universities' },
    ],
  },
  {
    label: 'Insights',
    children: [
      { label: 'Blog & Guides', desc: 'Country, course and cost guides' },
      { label: 'Events & Fairs', desc: 'Meet university delegates' },
      { label: 'Success Stories', desc: 'Hear from our alumni' },
    ],
  },
  { label: 'Scholarships' },
  { label: 'About Us' },
];

export const searchOptions = {
  destinations: ['USA', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Japan', 'Germany', 'India'],
  fields: ['Business & Management', 'Computer Science & IT', 'Engineering', 'Health & Nursing', 'Hospitality & Tourism', 'Arts & Humanities', 'Data Science & AI'],
  intakes: ['January 2027', 'May 2027', 'September 2027', 'January 2028'],
};

export const heroStats = [
  { value: '15,000+', label: 'Students placed' },
  { value: '98%', label: 'Visa success rate' },
  { value: '650+', label: 'Partner universities' },
];

export const services = [
  {
    icon: 'GraduationCap',
    title: 'Study Abroad',
    text: 'Start your journey with St. Xavier — a transformative path built on expert counselling, honest advice and admissions to universities that fit your goals and budget.',
  },
  {
    icon: 'ClipboardCheck',
    title: 'Mock Test',
    text: 'Elevate your test preparation with full-length, exam-condition mock tests for IELTS, PTE and TOEFL — with band-level feedback from certified trainers.',
  },
  {
    icon: 'BookOpenCheck',
    title: 'Test Preparation',
    text: 'Unlock your full potential with structured classes, small batches and personal mentoring designed to elevate your score in the shortest possible time.',
  },
  {
    icon: 'CalendarCheck',
    title: 'Test Registration',
    text: 'Take the first step toward your global goals. We handle official test registration so you get the right date, centre and format — without the paperwork stress.',
  },
];

export const comprehensiveChips = ['University Search', 'Test Preparation', 'Documentation', 'Interview Prep', 'Visa Support'];

// lat/lon drive the pin positions on the equirectangular world map
export const destinations = [
  { code: 'USA', name: 'USA', lat: 39, lon: -98, image: img('1485871981521-5b1fd3805eee'), unis: '4,000+', text: 'Home to the world’s largest higher-education system, the USA offers unmatched flexibility, research funding and OPT work rights for graduates.' },
  { code: 'CAN', name: 'Canada', lat: 57, lon: -105, image: img('1517935706615-2717063c2225'), unis: '220+', text: 'Affordable, welcoming and globally respected — Canada blends co-op work programs with clear post-study work and residency pathways.' },
  { code: 'GBR', name: 'United Kingdom', lat: 53, lon: -2, image: img('1513635269975-59663e0ac1ad'), unis: '160+', text: 'Earn a world-class degree in less time — one-year masters, centuries of academic heritage and a two-year Graduate Route visa.' },
  { code: 'DEU', name: 'Germany', lat: 51, lon: 10, image: img('1560969184-10fe8719e047'), unis: '400+', text: 'Low or no tuition at public universities, a booming engineering sector and an 18-month post-study job-seeker permit.' },
  { code: 'IND', name: 'India', lat: 22, lon: 79, image: img('1587474260584-136574528ed5'), unis: '1,000+', text: 'Study close to home at globally ranked institutions with a culture you know and costs that make sense for families.' },
  { code: 'JPN', name: 'Japan', lat: 36, lon: 138, image: img('1540959733332-eab4deabeeaf'), unis: '780+', text: 'Cutting-edge technology, generous MEXT scholarships and a safe, fascinating culture make Japan a rising favourite.' },
  { code: 'AUS', name: 'Australia', lat: -25, lon: 134, image: img('1506973035872-a4ec16b8e8d9'), unis: '40+', text: 'Sunshine, Group of Eight universities and generous post-study work rights — Australia is a top choice for Nepali students.' },
  { code: 'NZL', name: 'New Zealand', lat: -41, lon: 173, image: img('1507699622108-4be3abd695ad'), unis: '8', text: 'Every one of New Zealand’s universities ranks in the global top 3% — paired with stunning landscapes and a relaxed lifestyle.' },
];

export const edge = [
  { icon: 'Globe2', title: 'Global Company', text: 'With offices across Nepal, India & Australia' },
  { icon: 'Users', title: 'Exposure of our Team', text: 'Trained, certified & widely travelled counsellors' },
  { icon: 'Award', title: 'Certifications', text: 'ICEF, British Council, PIER & ECAN certified' },
  { icon: 'Building2', title: 'Location & Infra', text: 'Smart classrooms, library & mock test centre' },
  { icon: 'Landmark', title: 'Legacy', text: '20 years of proven track record' },
  { icon: 'Layers', title: 'One-stop Solution', text: 'Test prep, admissions, visa & accommodation' },
  { icon: 'BadgeCheck', title: 'Visa Success Rate', text: 'Above national average across all destinations' },
  { icon: 'Compass', title: 'Visionary Leadership', text: 'Led by educators & international alumni' },
];

export const whyChoose = [
  { icon: 'Target', title: 'Expert Guidance for All Programs', text: 'Comprehensive support for undergraduate, graduate and professional programs tailored to your academic profile.' },
  { icon: 'Globe', title: 'Global University Network', text: 'Access to top universities in the USA, UK, Canada, Australia, Europe and Asia through official partnerships.' },
  { icon: 'FileCheck2', title: 'Visa & Documentation Expertise', text: 'Complete visa counselling and documentation assistance with consistently high success rates across destinations.' },
  { icon: 'UserCheck', title: 'Personalized University Selection', text: 'Data-driven shortlisting matched to your academic profile, career goals and budget requirements.' },
  { icon: 'PenLine', title: 'Comprehensive Test Preparation', text: 'Expert coaching for IELTS, TOEFL, PTE, SAT, GRE and GMAT with proven score-improvement strategies.' },
  { icon: 'Wallet', title: 'Scholarship & Financial Support', text: 'Guidance on scholarships, education loans and financial planning to make studying abroad affordable.' },
  { icon: 'Plane', title: 'Post-Arrival Assistance', text: 'Comprehensive support including accommodation, airport pickup, orientation and settling-in help in your chosen country.' },
];

export const studentStories = [
  { name: 'Kamendra Kumar Shah', uni: 'University of Melbourne', country: 'Australia', image: img('1507003211169-0a1dd7228f2d', 600), quote: 'My counsellor helped me turn a gap year into a strength in my SOP. I received my offer and visa within eight weeks.' },
  { name: 'Seema Bantawa Rai', uni: 'University of Toronto', country: 'Canada', image: img('1494790108377-be9c29b29330', 600), quote: 'The mock interviews were tougher than the real one — which is exactly why I walked out of my visa interview smiling.' },
  { name: 'Anjanee Shah', uni: 'University of Leeds', country: 'United Kingdom', image: img('1534528741775-53994a69daeb', 600), quote: 'From IELTS 6.0 to 7.5 in two months. The trainers at St. Xavier genuinely care about every student.' },
  { name: 'Prabin Gurung', uni: 'Arizona State University', country: 'USA', image: img('1506794778202-cad84cf45f1d', 600), quote: 'They found me a scholarship I did not even know existed. That changed what was financially possible for my family.' },
  { name: 'Rojina Thapa', uni: 'TU Munich', country: 'Germany', image: img('1544005313-94ddf0286df2', 600), quote: 'Applying to a tuition-free university felt impossible until the team broke it down step by step.' },
];

export const process = [
  { step: 'Step 1', icon: 'MessageCircle', title: 'Free Counselling Session', text: 'Understand your goals, background and preferences to create a personalised roadmap for your study abroad journey.' },
  { step: 'Step 2', icon: 'ListChecks', title: 'University Shortlisting', text: 'We match your profile with suitable universities and countries based on your academic background, budget and career goals.' },
  { step: 'Step 3', icon: 'FileText', title: 'Application & Documentation Support', text: 'Complete assistance with SOPs, LORs, applications and required documents to strengthen your application.' },
  { step: 'Step 4', icon: 'Stamp', title: 'Visa & Pre-Departure Guidance', text: 'Expert visa interviews, thorough document checks and complete travel support to ensure a smooth transition.' },
];

export const testimonials = [
  { name: 'Smarika Chauhan', meta: 'Master of Nursing · Deakin University', image: img('1438761681033-6461ffad8d80', 200), text: 'My counsellor was beneficial during my visa process. He promptly answered all my queries as a student applying for a nursing course. Even during a stressful period, I always felt guided.' },
  { name: 'Aarju Karki', meta: 'MBA · University of Sydney', image: img('1500648767791-00dcc994a43e', 200), text: 'Thank you for providing me with such a great opportunity to study abroad. I would like to thank the team at St. Xavier who were always helpful and kind throughout the process.' },
  { name: 'Aashish Poudel', meta: 'BSc Computing · Coventry University', image: img('1539571696357-5a69c17a67c6', 200), text: 'I would like to thank St. Xavier from my heart. From the first counselling session to the pre-departure briefing, the team’s guidance and support made everything clear and stress-free.' },
  { name: 'Sneha Adhikari', meta: 'MSc Data Science · University of Auckland', image: img('1544005313-94ddf0286df2', 200), text: 'The PTE classes were focused and practical. I scored 79 on my first attempt and my counsellor took care of the rest. Highly recommended for anyone serious about studying abroad.' },
  { name: 'Bibek Shrestha', meta: 'BEng Mechanical · RMIT University', image: img('1507003211169-0a1dd7228f2d', 200), text: 'Transparent fees, honest advice and genuine follow-up. They never pushed me toward a university that wasn’t right for me.' },
];

export const essentials = [
  { icon: 'Plane', title: 'Flight', text: 'Domestic & international tickets at student fares', tint: 'sky' },
  { icon: 'BedDouble', title: 'Rooms', text: 'Verified domestic & international student housing', tint: 'rose' },
  { icon: 'ArrowLeftRight', title: 'Forex', text: 'Purchase foreign currency at the best market rate', tint: 'amber' },
];

export const partners = [
  'University of Toronto', 'Monash University', 'University of Leeds', 'Arizona State University',
  'Deakin University', 'University of Auckland', 'Coventry University', 'RMIT University',
  'TU Munich', 'Macquarie University', 'University of East Anglia', 'Western Sydney University',
];

export const faqs = [
  { q: 'What does a study abroad consultancy do?', a: 'We guide you through every stage — choosing a country and course, preparing for English tests, shortlisting universities, writing your SOP, applying, securing scholarships, preparing your visa file and settling in after arrival.' },
  { q: 'Which countries can St. Xavier help me apply to?', a: 'We work with universities in the USA, UK, Canada, Australia, New Zealand, Germany, Japan, India and several other European and Asian destinations.' },
  { q: 'Do you help with scholarships and financial planning?', a: 'Yes. Our counsellors identify merit and need-based scholarships you are eligible for, and help you plan tuition, living costs, education loans and the financial documents required for your visa.' },
  { q: 'How long does the study abroad process take?', a: 'Typically 3–8 months depending on the destination and intake. We recommend starting at least 6–9 months before your preferred intake so there is time for tests, applications and visa processing.' },
  { q: 'Do I need IELTS or TOEFL to study abroad?', a: 'Most universities require proof of English proficiency through IELTS, PTE, TOEFL or Duolingo. Some institutions offer waivers based on prior English-medium education — we’ll tell you which apply to you.' },
  { q: 'How much do your counselling services cost?', a: 'Your first counselling session is completely free. We will explain any service fees transparently before you commit to anything.' },
];

export const footer = {
  quickLinks: ['Blogs', 'Find Universities', 'Hi-Tech Score Calculator', 'Ages to Study Abroad', 'American Vs British English', 'Privacy Policy', 'Terms & Conditions'],
  support: ['Help Center', 'SOP Tips', 'Resources', 'Application Resources'],
  centers: [
    { city: 'Kathmandu', phone: '9851000001' },
    { city: 'Pokhara', phone: '9856000002' },
    { city: 'Chitwan', phone: '9855000003' },
    { city: 'Butwal', phone: '9857000004' },
    { city: 'Itahari', phone: '9852000005' },
    { city: 'Birtamode', phone: '9852000006' },
  ],
};
