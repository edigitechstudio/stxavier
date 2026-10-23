import type { ChatContent } from '@/types/chat';

/** AI assistant settings (page_content row "chat"). Editable in Supabase. */
export const chatContent: ChatContent = {
  enabled: true,
  assistant_name: { en: 'St. Xavier Assistant', ne: 'सेन्ट जेभियर सहायक' },
  greeting: {
    en: 'Namaste! I’m St. Xavier’s AI assistant. Ask me about studying abroad — costs, visas, test prep or our services.',
    ne: 'नमस्ते! म सेन्ट जेभियरको AI सहायक हुँ। विदेश अध्ययन — खर्च, भिसा, परीक्षा तयारी वा हाम्रा सेवाबारे सोध्नुहोस्।',
  },
  disclaimer: {
    en: 'AI assistant — answers come from our website and may be incomplete. For advice on your case, talk to a counsellor.',
    ne: 'AI सहायक — जवाफ हाम्रो वेबसाइटबाट आउँछ र अपूर्ण हुन सक्छ। आफ्नो अवस्थाबारे सल्लाहका लागि परामर्शदातासँग कुरा गर्नुहोस्।',
  },
  suggestions: [
    { en: 'How much does it cost to study in Australia?', ne: 'अष्ट्रेलियामा पढ्न कति खर्च लाग्छ?' },
    { en: 'Which documents do I need for a UK student visa?', ne: 'UK विद्यार्थी भिसाका लागि कुन कागजात चाहिन्छ?' },
    { en: 'Do you offer IELTS or PTE classes?', ne: 'IELTS वा PTE कक्षा छ?' },
    { en: 'Can I work while studying in Canada?', ne: 'क्यानडामा पढ्दै काम गर्न पाइन्छ?' },
  ],
  extra_instructions: '',
};
