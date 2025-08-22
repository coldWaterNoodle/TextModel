'use client';

import React, { useState, useEffect } from 'react';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types from the original page.tsx
interface ChartData { date: string; views: number; inflow: number; placeClicks: number; conversionRate: number; }
interface CampaignItem { date: string; postId: string; title: string; keywords: string[]; targetInflow?: number; achievedInflow: number; progressPercent: number; rank?: number; seoScore?: string; legalStatus?: string; postType?: string; }
interface ActiveCampaign { campaign: { id: string; name: string; periodStart: string; periodEnd: string; subjectCluster: string; }; targetInflow: number; achievedInflow: number; progressPercent: number; items: CampaignItem[]; }

interface ClientWrapperProps {
  initialChartData: ChartData[];
  activeCampaign: ActiveCampaign | null;
}

export function ChartsAndCampaignsClientWrapper({ initialChartData, activeCampaign }: ClientWrapperProps) {
  const [dateRange, setDateRange] = useState('주간');
  const [subject, setSubject] = useState('전체');
  const [chartData, setChartData] = useState(initialChartData);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/blog/chart-data?periodType=${dateRange === '주간' ? '주간' : '월간'}&subject=${subject}`);
        if (response.ok) setChartData(await response.json());
      } catch (error) { console.error('차트 데이터 조회 실패:', error); }
    };
    fetchChartData();
  }, [dateRange, subject]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <DateFilter selectedRange={dateRange} onSelectRange={setDateRange} />
          <SubjectFilter selectedSubject={subject} onSelectSubject={setSubject} />
        </div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">블로그 성과 분석</h3>
        <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip formatter={(value: any) => value.toLocaleString()} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="views" stroke="#8884d8" name="조회수" />
                  <Line yAxisId="left" type="monotone" dataKey="inflow" stroke="#82ca9d" name="검색 유입량" />
                  <Bar yAxisId="right" dataKey="placeClicks" fill="#ffc658" name="플레이스 클릭" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-gray-500">데이터 없음</div>}
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col h-[500px]">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">진행 중 캠페인</h2>
        {activeCampaign ? (
          <>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4 shrink-0">
              <div className="flex justify-between items-center text-xs mb-2">
                <p className="text-slate-600">
                  <span className="font-bold text-slate-800">기간:</span> {new Date(activeCampaign.campaign.periodStart).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\. /g, '.').slice(0, -1)} ~ {new Date(activeCampaign.campaign.periodEnd).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\. /g, '.').slice(0, -1)}
                </p>
                <p className="font-semibold text-slate-800">주제 클러스터: {activeCampaign.campaign.subjectCluster}</p>
              </div>
              <div className="text-xs">
                <div className="flex justify-between mb-1">
                  <p className="text-slate-600">달성 유입량: <span className="font-bold text-slate-900">{activeCampaign.achievedInflow}</span></p>
                  <p className="text-slate-600">목표 유입량: <span className="font-bold text-slate-900">{activeCampaign.targetInflow}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min((activeCampaign.achievedInflow / activeCampaign.targetInflow) * 100, 100)}%` }}></div></div>
                  <span className="font-bold text-teal-600 text-base">{Math.round((activeCampaign.achievedInflow / activeCampaign.targetInflow) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 pr-2 -mr-2 overflow-y-auto flex-grow min-h-0">
              {activeCampaign.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <h3 className="font-bold text-sm text-gray-800 leading-snug mb-2">{item.title}</h3>
                  <div className="space-y-1 text-gray-600">
                    <p>키워드: {item.keywords.join(', ')}</p>
                    <p>진행률: {item.progressPercent}% ({item.achievedInflow}/{item.targetInflow})</p>
                    {item.rank && <p>순위: {item.rank}위</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <div className="h-full flex items-center justify-center text-gray-500">진행 중인 캠페인이 없습니다.</div>}
      </div>
    </div>
  );
}
