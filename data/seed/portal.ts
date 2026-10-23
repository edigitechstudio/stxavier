import type { PortalContent } from '@/types/portal';

/**
 * Student-portal content (page_content row "portal"). Editable in Supabase.
 * TODO: confirm the document checklist with the counselling team and add verified
 * Nepali community contacts per country before launch.
 */
export const portalContent: PortalContent = {
  max_upload_mb: 10,
  document_types: [
    { key: 'passport', label: { en: 'Passport (bio page)', ne: 'राहदानी (विवरण पृष्ठ)' }, hint: { en: 'Valid for at least 6 months beyond your course start.', ne: 'कोर्स सुरु भएपछि कम्तीमा ६ महिना मान्य।' }, required: true },
    { key: 'academic', label: { en: 'Academic transcripts & certificates', ne: 'शैक्षिक ट्रान्सक्रिप्ट र प्रमाणपत्र' }, hint: { en: 'SEE, +2 and bachelor’s documents as applicable.', ne: 'SEE, +२ र स्नातक कागजात।' }, required: true },
    { key: 'english', label: { en: 'English test result (IELTS / PTE / TOEFL)', ne: 'अंग्रेजी परीक्षा नतिजा (IELTS / PTE / TOEFL)' }, hint: null, required: true },
    { key: 'sop', label: { en: 'Statement of purpose', ne: 'उद्देश्य विवरण (SOP)' }, hint: { en: 'Your draft — your counsellor will review it.', ne: 'तपाईंको मस्यौदा — परामर्शदाताले समीक्षा गर्नुहुनेछ।' }, required: true },
    { key: 'financial', label: { en: 'Financial documents', ne: 'आर्थिक कागजात' }, hint: { en: 'Bank statement, balance certificate, income sources.', ne: 'बैंक स्टेटमेन्ट, ब्यालेन्स प्रमाणपत्र, आय स्रोत।' }, required: true },
    { key: 'recommendation', label: { en: 'Recommendation letters', ne: 'सिफारिस पत्र' }, hint: null, required: false },
    { key: 'cv', label: { en: 'CV / résumé', ne: 'बायोडाटा (CV)' }, hint: null, required: false },
    { key: 'other', label: { en: 'Other document', ne: 'अन्य कागजात' }, hint: null, required: false },
  ],
  pre_departure: [
    {
      id: 'packing',
      icon: 'luggage',
      title: { en: 'Packing list', ne: 'सामान सूची' },
      countries: [],
      items: [
        { en: 'Passport, visa grant letter, offer letter and CAS/CoE — originals plus copies in your hand luggage', ne: 'राहदानी, भिसा पत्र, अफर लेटर र CAS/CoE — सक्कल र प्रतिलिपि ह्यान्ड लगेजमा' },
        { en: 'Academic certificates, English test result and financial documents', ne: 'शैक्षिक प्रमाणपत्र, अंग्रेजी परीक्षा नतिजा र आर्थिक कागजात' },
        { en: 'Some local currency or a travel card for the first days', ne: 'पहिलो केही दिनका लागि स्थानीय मुद्रा वा ट्राभल कार्ड' },
        { en: 'Prescription medicines with a doctor’s letter', ne: 'डाक्टरको पत्रसहित आवश्यक औषधि' },
        { en: 'Universal plug adapter and weather-appropriate clothing', ne: 'युनिभर्सल प्लग एड्याप्टर र मौसम अनुसारको लुगा' },
        { en: 'Check your airline’s baggage allowance and the destination’s customs rules on food items', ne: 'एयरलाइनको ब्यागेज सीमा र खानेकुरासम्बन्धी भन्सार नियम जाँच्नुहोस्' },
      ],
    },
    {
      id: 'airport',
      icon: 'plane',
      title: { en: 'Airport pickup & arrival', ne: 'एयरपोर्ट पिकअप र आगमन' },
      countries: [],
      items: [
        { en: 'Check whether your university offers a free airport pickup and book it in advance', ne: 'विश्वविद्यालयले निःशुल्क एयरपोर्ट पिकअप दिन्छ कि जाँच्नुहोस् र पहिल्यै बुक गर्नुहोस्' },
        { en: 'Share your flight details with your counsellor and family', ne: 'उडान विवरण परामर्शदाता र परिवारलाई पठाउनुहोस्' },
        { en: 'Keep your accommodation address and a contact number written down', ne: 'बस्ने ठेगाना र सम्पर्क नम्बर लेखेर राख्नुहोस्' },
        { en: 'Get a local SIM card on arrival and register with your university', ne: 'आइपुगेपछि स्थानीय सिम लिनुहोस् र विश्वविद्यालयमा दर्ता गर्नुहोस्' },
      ],
    },
    {
      id: 'accommodation',
      icon: 'home',
      title: { en: 'Accommodation tips', ne: 'आवास सुझाव' },
      countries: [],
      items: [
        { en: 'Apply early for university halls — places fill quickly', ne: 'विश्वविद्यालय होस्टलका लागि छिट्टै आवेदन दिनुहोस् — सिट चाँडै भरिन्छ' },
        { en: 'Never pay a deposit for a private room you have not verified', ne: 'प्रमाणित नगरेको निजी कोठाका लागि धरौटी नतिर्नुहोस्' },
        { en: 'Read the contract: bills, notice period and deposit protection', ne: 'सम्झौता पढ्नुहोस्: बिल, सूचना अवधि र धरौटी सुरक्षा' },
        { en: 'Budget for the first month’s rent plus deposit', ne: 'पहिलो महिनाको भाडा र धरौटीको बजेट राख्नुहोस्' },
      ],
    },
    {
      id: 'community',
      icon: 'users',
      title: { en: 'Nepali community contacts', ne: 'नेपाली समुदाय सम्पर्क' },
      countries: [],
      items: [
        { en: 'Join your university’s Nepali student society during welcome week', ne: 'वेलकम विकमा विश्वविद्यालयको नेपाली विद्यार्थी समाजमा जोडिनुहोस्' },
        { en: 'Register with the Embassy of Nepal in your destination country', ne: 'गन्तव्य देशको नेपाली दूतावासमा दर्ता गर्नुहोस्' },
        { en: 'TODO: verified local Nepali community contacts per country', ne: 'TODO: देशअनुसार प्रमाणित नेपाली समुदाय सम्पर्क' },
      ],
    },
  ],
};
