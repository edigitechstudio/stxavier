import { FaqList } from '@/components/home/faq-list';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/json-ld';
import { l } from '@/lib/i18n/localize';
import { faqSchema } from '@/lib/schema';
import type { Faq, Locale } from '@/types/content';

/** Answer-first FAQ block with FAQPage schema. Renders nothing when there are no questions. */
export async function FaqBlock({ id, title, faqs, locale }: { id?: string; title?: string; faqs: Faq[]; locale: Locale }) {
  if (!faqs.length) return null;
  const heading = title ?? (await getTranslations({ locale, namespace: 'common' }))('faq');
  return (
    <section className="block" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined}>{heading}</h2>
      <FaqList items={faqs.map((f) => ({ id: f.id, question: l(f.question, locale) ?? '', answer: l(f.answer, locale) ?? '' }))} />
      <JsonLd data={faqSchema(faqs, locale)} />
    </section>
  );
}
