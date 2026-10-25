import type { EnquiryContent } from '@/types/content';
import type { AvailabilityException, AvailabilityRule, BookingSettings } from '@/types/booking';

/**
 * Counsellor working hours (Nepal time). Editable in Supabase (counsellor_availability /
 * availability_exceptions) once seeded.
 * TODO: set each counsellor's real hours and add office holidays (Dashain, Tihar, public holidays).
 */
const SUN_TO_FRI = [0, 1, 2, 3, 4, 5];

const week = (counsellor: string, start: string, end: string, modes: AvailabilityRule['modes'] = ['office', 'zoom', 'whatsapp']): AvailabilityRule[] =>
  SUN_TO_FRI.map((weekday) => ({ id: `${counsellor}-${weekday}`, counsellor, weekday, start, end, slot_minutes: 30, modes }));

export const availability: AvailabilityRule[] = [
  ...week('sample-counsellor-uk', '10:00', '17:00'),
  ...week('sample-counsellor-australia', '10:00', '17:00'),
  ...week('sample-counsellor-north-america', '12:00', '18:00'),
  ...week('sample-counsellor-japan', '10:00', '16:00', ['office', 'zoom']),
];

export const availabilityExceptions: AvailabilityException[] = [];

export const bookingSettings: BookingSettings = {
  hero: {
    eyebrow: { en: 'Free counselling', ne: 'निःशुल्क परामर्श' },
    title: { en: 'Book your free session', ne: 'आफ्नो निःशुल्क सत्र बुक गर्नुहोस्' },
    highlight: { en: 'free session', ne: 'निःशुल्क सत्र' },
    subtitle: { en: 'Pick a counsellor and a time that suits you. In our office, on Zoom or by WhatsApp call.', ne: 'आफूलाई मिल्ने परामर्शदाता र समय छान्नुहोस्, कार्यालय, Zoom वा WhatsApp कलमार्फत।' },
    image: null,
  },
  min_notice_minutes: 120,
  horizon_days: 14,
  office_address: { en: 'St. Xavier Educational Network, Kathmandu (TODO: full address)', ne: 'सेन्ट जेभियर एजुकेशनल नेटवर्क, काठमाडौं' },
  zoom_note: { en: 'We will email you the Zoom link before your session.', ne: 'सत्रअघि Zoom लिंक इमेलमा पठाइनेछ।' },
  whatsapp_note: { en: 'Your counsellor will call you on WhatsApp at the booked time.', ne: 'बुक गरिएको समयमा परामर्शदाताले WhatsApp मा फोन गर्नुहुनेछ।' },
};

export const enquiryContent: EnquiryContent = {
  hero: {
    eyebrow: { en: 'Enquiry', ne: 'सोधपुछ' },
    title: { en: 'Tell us about your plans', ne: 'आफ्नो योजना बताउनुहोस्' },
    highlight: { en: 'your plans', ne: 'योजना' },
    subtitle: { en: 'A few quick questions. A counsellor will get back to you within one working day.', ne: 'केही छोटा प्रश्न, परामर्शदाताले एक कार्यदिनभित्र सम्पर्क गर्नुहुनेछ।' },
    image: null,
  },
  needs: [
    { value: 'counselling', label: { en: 'Study abroad counselling', ne: 'विदेश अध्ययन परामर्श' } },
    { value: 'test-prep', label: { en: 'IELTS / PTE / TOEFL / Japanese classes', ne: 'IELTS / PTE / TOEFL / जापानी कक्षा' } },
    { value: 'visa', label: { en: 'Visa application help', ne: 'भिसा आवेदन सहयोग' } },
    { value: 'scholarship', label: { en: 'Scholarships', ne: 'छात्रवृत्ति' } },
    { value: 'other', label: { en: 'Something else', ne: 'अरू केही' } },
  ],
  levels: [
    { value: 'diploma', label: { en: 'Diploma / foundation', ne: 'डिप्लोमा / फाउन्डेसन' } },
    { value: 'bachelor', label: { en: "Bachelor's degree", ne: 'स्नातक' } },
    { value: 'master', label: { en: "Master's degree", ne: 'स्नातकोत्तर' } },
    { value: 'phd', label: { en: 'PhD / research', ne: 'पीएचडी / अनुसन्धान' } },
    { value: 'language', label: { en: 'Language course', ne: 'भाषा कोर्स' } },
  ],
};
