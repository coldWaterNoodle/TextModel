'use client';

import React, { useState, useMemo } from 'react';
import { KpiCard } from '@/components/channels/KpiCard';
import { Button } from '@/components/ui/button';
import { IssueReportDialog_Place } from '../place/IssueReportDialog_Place';
import { PlaceReview, PlaceReviewReport } from '@/services/airtable';
import { MessageSquareWarning } from 'lucide-react';

interface PlaceIssueSummaryCardProps {
  reviews: PlaceReview[];
  reports: PlaceReviewReport[];
}

export const PlaceIssueSummaryCard: React.FC<PlaceIssueSummaryCardProps> = ({ reviews, reports }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const negativeReviewCount = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    return reviews.filter(
      (r) => r.AuthorAt && new Date(r.AuthorAt) >= oneWeekAgo && r.Score && r.Score < 3
    ).length;
  }, [reviews]);

  return (
    <>
      <KpiCard
        title="방문자 리뷰 현황"
        description="최근 1주 부정 리뷰"
        icon={<MessageSquareWarning className="w-5 h-5 text-red-600" />}
        value={`부정 ${negativeReviewCount}건`}
        valueClassName="text-red-600"
        changeType="action"
        footer={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={negativeReviewCount === 0}
          >
            검토 보고서 확인
          </Button>
        }
      />
      <IssueReportDialog_Place
        reports={reports}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
