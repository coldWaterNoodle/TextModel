import { NextResponse } from 'next/server';
import AirtableService from '@/services/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('fetchAll') === 'true';

    const [
      rankings,
      details,
      { reviews, total: totalReviews },
      reviewWords,
      reviewReports
    ] = await Promise.all([
      AirtableService.getPlaceRankings(),
      AirtableService.getPlaceDetails(),
      // If fetchAll is true, get all reviews, otherwise paginate
      AirtableService.getPlaceReviews(1, fetchAll ? 10000 : 10), 
      AirtableService.getPlaceReviewWords(),
      AirtableService.getPlaceReviewReports(),
    ]);

    return NextResponse.json({
      rankings,
      details,
      reviews,
      totalReviews: fetchAll ? reviews.length : totalReviews,
      reviewWords,
      reviewReports,
    });
  } catch (error) {
    console.error('Failed to get place channel data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
