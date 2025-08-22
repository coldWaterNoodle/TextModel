'use client';

import React from 'react';
import { CafeIssueSummaryCard } from './CafeIssueSummaryCard';
import { PlaceIssueSummaryCard } from './PlaceIssueSummaryCard';
import { CafeReportRow, PlaceReview, PlaceReviewReport } from '@/services/airtable';

interface CombinedReputationIssuesProps {
  cafeIssues: CafeReportRow[];
  placeReviews: PlaceReview[];
  placeReviewReports: PlaceReviewReport[];
}

export function ReputationIssues({ cafeIssues, placeReviews, placeReviewReports }: CombinedReputationIssuesProps) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <CafeIssueSummaryCard issueReport={cafeIssues} />
      <PlaceIssueSummaryCard reviews={placeReviews} reports={placeReviewReports} />
    </div>
  );
}
