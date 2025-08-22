'use client';

import React from 'react';
import { TrendingUp, Eye, MessageCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface OurClinicData {
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  totalViews: number;
  engagementRate: number;
}

interface OurClinicStatsProps {
  channel: string;
  data: OurClinicData | null;
  subject: string;
  dateRange: string;
}

export function OurClinicStats({ channel, data, subject, dateRange }: OurClinicStatsProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          {channel} - 내이튼치과 통계
        </h2>
        <div className="text-center py-8 text-gray-500">
          데이터를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  const totalMentions = data.positiveMentions + data.negativeMentions + data.neutralMentions;
  const positiveRate = totalMentions > 0 ? (data.positiveMentions / totalMentions * 100).toFixed(1) : '0';
  const negativeRate = totalMentions > 0 ? (data.negativeMentions / totalMentions * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {channel} - 내이튼치과 통계
        </h2>
        <div className="text-sm text-gray-500">
          {subject} • {dateRange}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 언급 수 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">총 언급</p>
              <p className="text-2xl font-bold text-blue-900">{data.totalMentions}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* 총 조회수 */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">총 조회수</p>
              <p className="text-2xl font-bold text-green-900">{data.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* 참여율 */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">참여율</p>
              <p className="text-2xl font-bold text-purple-900">{(data.engagementRate * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        {/* 긍정률 */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">긍정률</p>
              <p className="text-2xl font-bold text-emerald-900">{positiveRate}%</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 감정 분석 상세 */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-4 text-gray-800">감정 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">긍정</span>
            </div>
            <span className="text-lg font-bold text-emerald-900">{data.positiveMentions}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">중립</span>
            </div>
            <span className="text-lg font-bold text-gray-900">{data.neutralMentions}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700">부정</span>
            </div>
            <span className="text-lg font-bold text-red-900">{data.negativeMentions}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
