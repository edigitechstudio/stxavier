'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';

export type FaqItem = { id: string; question: string; answer: string };

/** Accordion whose answers stay in the HTML (collapsed with CSS) so crawlers and answer engines read them. */
export function FaqList({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="faq-list">
      {items.map((f) => {
        const isOpen = openId === f.id;
        return (
          <div key={f.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
            <h3>
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                aria-controls={`faq-${f.id}`}
                id={`faq-q-${f.id}`}
                onClick={() => setOpenId(isOpen ? null : f.id)}
              >
                {f.question}
                <span className="faq-toggle" aria-hidden><Plus size={18} /></span>
              </button>
            </h3>
            <div className="faq-a" id={`faq-${f.id}`} role="region" aria-labelledby={`faq-q-${f.id}`}>
              <div>
                <p data-speakable>{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
