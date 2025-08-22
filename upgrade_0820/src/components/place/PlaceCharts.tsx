'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PlaceRanking,
  PlaceDetail,
  PlaceReview,
  PlaceReviewWord,
} from '@/services/airtable';
import AirtableService from '@/services/airtable'; // Import the service
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import WordCloud with SSR turned off
const WordCloud = dynamic(() => import('react-d3-cloud-modern'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[300px]" />,
});


// 1. 유입량 및 순위 변화 차트
const AnalyticsChart: React.FC<{
  rankings: PlaceRanking[];
  details: PlaceDetail[];
}> = ({ rankings, details }) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const chartData = useMemo(() => {
    const combined: Record<string, { rank: number; rankCount: number; pv: number }> = {};

    details.forEach((d) => {
      const dateKey = period === 'weekly' ? d.Week : d.Week.substring(0, 7);
      if (!combined[dateKey]) combined[dateKey] = { rank: 0, rankCount: 0, pv: 0 };
      combined[dateKey].pv += d.TotalPV;
    });

    rankings.forEach((r) => {
      const dateKey = period === 'weekly' ? r.Week : r.Week.substring(0, 7);
      if (combined[dateKey]) {
        combined[dateKey].rank += r.Rank;
        combined[dateKey].rankCount += 1;
      }
    });

    return Object.entries(combined)
      .map(([date, values]) => ({
        date,
        '평균 순위':
          values.rankCount > 0
            ? parseFloat((values.rank / values.rankCount).toFixed(1))
            : null,
        '유입량': values.pv,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(period === 'weekly' ? -12 : -12);
  }, [rankings, details, period]);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>유입량 및 순위 변화</CardTitle>
        {/* TODO: Add weekly/monthly toggle */}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis
              yAxisId="left"
              label={{ value: '유입량', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              reversed
              label={{ value: '평균 순위', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="유입량" yAxisId="left" fill="#8884d8" />
            <Line
              type="monotone"
              dataKey="평균 순위"
              yAxisId="right"
              stroke="#82ca9d"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// 2. 방문자 리뷰 분석 (워드클라우드)
const ReviewAnalysis: React.FC<{
  words: PlaceReviewWord[];
}> = React.memo(({ words }) => { // Memoize ReviewAnalysis
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    // Fetch all reviews once to calculate the average score
    const fetchAllReviewsForScore = async () => {
      // Assuming getPlaceReviews can fetch all if page/pageSize are omitted or high
      const { reviews } = await AirtableService.getPlaceReviews(1, 1000); // Fetch a large number of reviews
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentReviews = reviews.filter(r => new Date(r.AuthorAt) > oneMonthAgo);
      if (recentReviews.length > 0) {
        const totalScore = recentReviews.reduce((sum, r) => sum + r.Score, 0);
        setAvgScore(totalScore / recentReviews.length);
      }
    };
    fetchAllReviewsForScore();
  }, []); // Empty dependency array, runs once

  const wordData = useMemo(
    () => words.map((w) => ({ text: w.Word, value: w.Count })),
    [words]
  );
  
  const fontSizeMapper = (word: { value: number }) => Math.log2(word.value) * 5 + 10;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>방문자 리뷰 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-lg">월 평균 별점</p>
          <p className="text-3xl font-bold">{avgScore.toFixed(1)}</p>
        </div>
        <div style={{ width: '100%', height: '250px' }}>
          {wordData.length > 0 && (
            <WordCloud
                data={wordData}
                width={500}
                height={250}
                font="sans-serif"
                fontSize={fontSizeMapper}
                rotate={0}
                padding={2}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
});
ReviewAnalysis.displayName = 'ReviewAnalysis';


export const PlaceCharts: React.FC<{
    data: {
        rankings: PlaceRanking[];
        details: PlaceDetail[];
        reviewWords: PlaceReviewWord[];
    }
}> = React.memo(({ data }) => { // Memoize PlaceCharts
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <AnalyticsChart rankings={data.rankings} details={data.details} />
            <ReviewAnalysis words={data.reviewWords} />
        </div>
    )
});
PlaceCharts.displayName = 'PlaceCharts';

// Skeleton component for Charts
export function ChartsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
            <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6 h-96"></div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 h-96"></div>
        </div>
    );
}
