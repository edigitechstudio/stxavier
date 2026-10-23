import { getExchangeRates } from '@/lib/rates';

/** NPR exchange rates (Nepal Rastra Bank selling rates, cached hourly). */
export async function GET() {
  return Response.json(await getExchangeRates(), {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
