'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

type ContactContext = {
  phone: string;
  whatsapp: string;
  /** Pre-filled WhatsApp messages, already translated. `{x}` is replaced per page. */
  messages: { default: string; destination: string; testPrep: string; tool: string };
  /** slug → display name lookups so the message can name the page's subject. */
  names: { destinations: Record<string, string>; testPrep: Record<string, string>; tools: Record<string, string> };
};

const Ctx = createContext<ContactContext | null>(null);

export function ContactProvider({ value, children }: { value: ContactContext; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContact() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useContact must be used inside <ContactProvider>');
  return ctx;
}

/** WhatsApp link with the generic greeting (used before the pathname is known). */
export function useDefaultWhatsAppHref() {
  const { whatsapp, messages } = useContact();
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(messages.default)}`;
}

/**
 * WhatsApp deep link whose message reflects the current page (e.g. "…studying in Australia").
 * Reads the pathname, so callers must sit inside <Suspense>.
 */
export function useWhatsAppHref() {
  const { whatsapp, messages, names } = useContact();
  const pathname = usePathname();
  const [, section, slug] = pathname.split('/');

  let text = messages.default;
  if (section === 'study-in' && names.destinations[slug]) text = messages.destination.replace('{country}', names.destinations[slug]);
  else if (section === 'test-prep' && names.testPrep[slug]) text = messages.testPrep.replace('{course}', names.testPrep[slug]);
  else if (section === 'tools' && names.tools[slug]) text = messages.tool.replace('{tool}', names.tools[slug]);

  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}
