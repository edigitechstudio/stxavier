import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { GoogleReviews } from '@/types/trust';

type PlacesResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating: number;
    text?: { text: string };
    originalText?: { text: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
};

/**
 * Real Google reviews via the Places API (New), cached for a day. Returns null when
 * GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID are not configured or the API fails — the widget and
 * AggregateRating schema then simply don't render (we never show made-up ratings).
 */
export async function getGoogleReviews(locale: string): Promise<GoogleReviews | null> {
  'use cache';
  cacheTag('google-reviews');
  cacheLife('days');

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${locale === 'ne' ? 'ne' : 'en'}`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PlacesResponse;
    if (!data.rating || !data.userRatingCount) return null;
    return {
      rating: data.rating,
      count: data.userRatingCount,
      url: data.googleMapsUri ?? null,
      reviews: (data.reviews ?? []).map((r) => ({
        author: r.authorAttribution?.displayName ?? 'Google user',
        authorUrl: r.authorAttribution?.uri ?? null,
        photo: r.authorAttribution?.photoUri ?? null,
        rating: r.rating,
        text: r.text?.text ?? r.originalText?.text ?? '',
        relativeTime: r.relativePublishTimeDescription ?? '',
        publishTime: r.publishTime ?? '',
      })),
    };
  } catch {
    return null;
  }
}
