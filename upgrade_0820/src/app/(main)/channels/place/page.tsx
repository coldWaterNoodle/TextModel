import React, { Suspense } from 'react';
import AirtableService from '@/services/airtable';
import { PlaceKpiCards, KpiCardsSkeleton } from '@/components/place/PlaceKpiCards';
import { PlaceCharts, ChartsSkeleton } from '@/components/place/PlaceCharts';
import { PlaceReviewTable, TableSkeleton } from '@/components/place/PlaceReviewTable';

// page.tsx is now a Server Component for initial data fetching
export default async function PlacePage() {
  
  // Fetch all data directly on the server
  const [
    rankings,
    details,
    { reviews },
    reviewWords,
    reviewReports,
  ] = await Promise.all([
    AirtableService.getPlaceRankings(),
    AirtableService.getPlaceDetails(),
    AirtableService.getPlaceReviews(1, 10000), // Fetch all reviews
    AirtableService.getPlaceReviewWords(),
    AirtableService.getPlaceReviewReports(),
  ]);

  const placePageData = {
    rankings,
    details,
    reviews,
    reviewWords,
    reviewReports,
    totalReviews: reviews.length,
  };

  const chartsData = {
    rankings,
    details,
    reviewWords,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            네이버 플레이스 분석
          </h1>
          <p className="text-gray-600">
            네이버 플레이스 순위 및 경쟁사 현황을 모니터링합니다.
          </p>
        </div>

        <Suspense fallback={<><KpiCardsSkeleton /><ChartsSkeleton /><TableSkeleton /></>}>
            <PlaceKpiCards data={placePageData} />
            <PlaceCharts data={chartsData} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <PlaceReviewTable reviews={reviews} />
            </div>
        </Suspense>
      </div>
    </div>
  );
}
