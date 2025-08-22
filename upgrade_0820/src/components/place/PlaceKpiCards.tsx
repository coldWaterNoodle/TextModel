'use client';

import React, { useState, useMemo } from 'react';
import { KpiCard } from '@/components/channels/KpiCard';
import { Button } from '@/components/ui/button';
import { IssueReportDialog_Place } from '../place/IssueReportDialog_Place';
import {
  PlaceRanking,
  PlaceDetail,
  PlaceReview,
  PlaceReviewReport,
} from '@/services/airtable';
import { TrendingUp, Eye, MessageSquareWarning } from 'lucide-react';

export const PlaceKpiCards: React.FC<{
  data: {
    rankings: PlaceRanking[];
    details: PlaceDetail[];
    reviews: PlaceReview[];
    reviewReports: PlaceReviewReport[];
  };
}> = ({ data }) => {
  const { rankings, details, reviews, reviewReports } = data;
  const [selectedKeyword, setSelectedKeyword] = useState(
    rankings.length > 0 ? rankings[0].Keyword : ''
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const keywords = useMemo(
    () => Array.from(new Set(rankings.map((r) => r.Keyword))),
    [rankings]
  );

  const rankingData = useMemo(() => {
    const filtered = rankings
      .filter((r) => r.Keyword === selectedKeyword)
      .sort((a, b) => new Date(b.Week).getTime() - new Date(a.Week).getTime());
    const latest = filtered[0]?.Rank;
    const prev = filtered[1]?.Rank;
    const change = prev && latest ? prev - latest : 0;
    return {
      value: latest ? `${latest}위` : 'N/A',
      change:
        change > 0
          ? `+${change}위`
          : change < 0
          ? `${change}위`
          : '변동 없음',
      changeType: change > 0 ? 'increase' : 'decrease',
    };
  }, [rankings, selectedKeyword]);

  const inflowData = useMemo(() => {
    const sorted = details.sort(
      (a, b) => new Date(b.Week).getTime() - new Date(a.Week).getTime()
    );
    const latest = sorted[0]?.TotalPV;
    const prev = sorted[1]?.TotalPV;
    const change = prev && latest ? latest - prev : 0;
    const changePercent = prev ? (change / prev) * 100 : 0;
    return {
      value: latest?.toLocaleString() || 'N/A',
      change: `${change >= 0 ? '+' : ''}${change.toLocaleString()} (${changePercent.toFixed(1)}%)`,
      changeType: change >= 0 ? 'increase' : 'decrease',
    };
  }, [details]);

  const reviewData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const negativeCount = reviews.filter(
      (r) => new Date(r.AuthorAt) >= oneWeekAgo && r.Score < 3
    ).length;
    return {
      value: `부정 ${negativeCount}건`,
    };
  }, [reviews]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title="지도 순위"
          description="최근 1주 순위"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          value={rankingData.value}
          change={rankingData.change}
          changeType={rankingData.changeType as any}
          filters={keywords}
          selectedFilter={selectedKeyword}
          onFilterChange={setSelectedKeyword}
        />
        <KpiCard
          title="플레이스 유입량"
          description="최근 1주 유입"
          icon={<Eye className="w-5 h-5 text-green-600" />}
          value={inflowData.value}
          change={inflowData.change}
          changeType={inflowData.changeType as any}
        />
        <KpiCard
          title="방문자 리뷰 현황"
          description="최근 1주 부정 리뷰"
          icon={<MessageSquareWarning className="w-5 h-5 text-red-600" />}
          value={reviewData.value}
          valueClassName="text-red-600"
          changeType="action"
          footer={
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              검토 보고서 확인
            </Button>
          }
        />
      </div>
      <IssueReportDialog_Place
        reports={reviewReports}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

// Skeleton component for KPI Cards
export function KpiCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 h-40 animate-pulse"></div>
            <div className="bg-white rounded-lg shadow-sm p-6 h-40 animate-pulse"></div>
            <div className="bg-white rounded-lg shadow-sm p-6 h-40 animate-pulse"></div>
        </div>
    );
}
