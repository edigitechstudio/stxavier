import { availability, availabilityExceptions } from '@/data/seed/booking';
import type { AvailabilityException, AvailabilityRule } from '@/types/booking';

/**
 * Working hours when Supabase isn't configured. Kept on globalThis so admin edits made in local
 * demo mode apply to the booking page too (until the dev server restarts).
 */
type Holder = { rules: AvailabilityRule[]; exceptions: AvailabilityException[] };
const g = globalThis as unknown as { __sxAvailability?: Holder };
export const devAvailability = (): Holder => (g.__sxAvailability ??= { rules: structuredClone(availability), exceptions: structuredClone(availabilityExceptions) });
