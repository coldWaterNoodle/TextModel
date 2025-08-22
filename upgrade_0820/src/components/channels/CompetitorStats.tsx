'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, MessageCircle } from 'lucide-react';

interface CompetitorData {
  name: string;
  mentions: number;
  views: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface CompetitorStatsProps {
  channel: string;
  data: CompetitorData[] | null;
  subject: string;
  dateRange: string;
}

export function CompetitorStats({ channel, data, subject, dateRange }: CompetitorStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          {channel} - 경쟁 병원 분석
        </h2>
        <div className="text-center py-8 text-gray-500">
          경쟁 병원 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '긍정';
      case 'negative':
        return '부정';
      default:
        return '중립';
    }
  };

  // 언급 수 기준으로 정렬
  const sortedData = [...data].sort((a, b) => b.mentions - a.mentions);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {channel} - 경쟁 병원 분석
        </h2>
        <div className="text-sm text-gray-500">
          {subject} • {dateRange}
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.map((competitor, index) => (
          <div key={competitor.name} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{competitor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getSentimentIcon(competitor.sentiment)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(competitor.sentiment)}`}>
                      {getSentimentText(competitor.sentiment)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MessageCircle className="w-4 h-4" />
                    <span>언급</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{competitor.mentions}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    <span>조회</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{competitor.views.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 통계 */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-md font-semibold mb-4 text-gray-800">요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-600">총 경쟁 병원</p>
            <p className="text-xl font-bold text-blue-900">{data.length}개</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm font-medium text-green-600">총 언급 수</p>
            <p className="text-xl font-bold text-green-900">
              {data.reduce((sum, comp) => sum + comp.mentions, 0)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-600">총 조회수</p>
            <p className="text-xl font-bold text-purple-900">
              {data.reduce((sum, comp) => sum + comp.views, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
