import { z } from 'zod';
import { isValidNepaliPhone, normalizeNepaliPhone } from './phone';

export const leadSchema = z.object({
  source: z.enum(['counselling', 'enquiry', 'contact', 'parent', 'eligibility', 'event_rsvp', 'guide_download', 'booking', 'chat']).default('counselling'),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().refine(isValidNepaliPhone, 'invalid_phone').transform(normalizeNepaliPhone),
  email: z.union([z.email().max(254), z.literal('')]).optional(),
  destination: z.string().max(80).optional(),
  intake: z.string().max(80).optional(),
  field: z.string().max(120).optional(),
  course: z.string().max(80).optional(),
  counsellor: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  /** Tool answers (e.g. eligibility quiz) stored with the lead for the counsellor. */
  answers: z
    .record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean(), z.null(), z.array(z.string().max(60)).max(20)]))
    .refine((o) => Object.keys(o).length <= 30, 'too_many_answers')
    .optional(),
  locale: z.enum(['en', 'ne']).default('en'),
  page_path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm: z
    .object({
      utm_source: z.string().max(120).optional(),
      utm_medium: z.string().max(120).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
    })
    .default({}),
  website: z.string().max(0).optional(), // honeypot
  turnstile_token: z.string().optional(),
});

export type LeadInput = z.input<typeof leadSchema>;
