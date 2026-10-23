import { Instrument_Serif, Mukta, Plus_Jakarta_Sans } from 'next/font/google';

/** Shared by the localized site layout and the English-only /admin layout. */
export const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
// Devanagari is only used on /ne pages: don't preload it on every page, where it would compete
// with the hero image for bandwidth; /ne loads it on demand (swap). Two weights keep it light —
// the browser maps 500 → 400 and 600/800 → 700.
export const mukta = Mukta({ subsets: ['devanagari', 'latin'], weight: ['400', '700'], variable: '--font-mukta', display: 'swap', preload: false });
