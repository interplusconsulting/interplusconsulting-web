import ReviewsSection, { type GoogleReview, type GoogleSummary } from './reviews-section';

/**
 * Reviews section. Always shows the 5-star reviews admins add in /admin/reviews.
 * Optionally adds 5-star reviews fetched on the server from the Google Places API (New) when
 * GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are set (server-only env vars). Google returns at most 5 reviews.
 */

type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type PlaceDetails = { rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: PlaceReview[] };

async function fetchPlace(): Promise<PlaceDetails | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId || !/^[\w-]{10,}$/.test(placeId)) return null;
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=th`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return null;
    return (await response.json()) as PlaceDetails;
  } catch {
    return null;
  }
}

export default async function GoogleReviews() {
  const place = await fetchPlace();
  const google: GoogleReview[] = (place?.reviews ?? [])
    .filter(review => review.rating === 5 && (review.text?.text || review.originalText?.text))
    .map(review => ({
      author: review.authorAttribution?.displayName ?? 'ผู้ใช้ Google',
      authorUrl: review.authorAttribution?.uri ?? '',
      photo: review.authorAttribution?.photoUri ?? '',
      text: review.text?.text || review.originalText?.text || '',
      when: review.relativePublishTimeDescription ?? '',
    }));
  const summary: GoogleSummary = place?.rating ? { rating: place.rating, count: place.userRatingCount ?? 0, url: place.googleMapsUri ?? '' } : null;
  return <ReviewsSection google={google} summary={summary} />;
}
