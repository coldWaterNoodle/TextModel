'use client';

import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Eye, MessageSquare, Plus, Minus } from 'lucide-react';
import { NegativeMentionsAlert } from './NegativeMentionsAlert';
import { OurClinicPostsList } from './OurClinicPostsList';
import { OurClinicTrends } from './OurClinicTrends';

interface OurClinicMonitoringProps {
  dateRange: string;
  subject: string;
}

export function OurClinicMonitoring({ dateRange, subject }: OurClinicMonitoringProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 가상 데이터 (실제로는 API에서 가져올 데이터)
  const clinicData = {
    totalMentions: 15,
    positiveMentions: 10,
    negativeMentions: 3,
    neutralMentions: 2,
    totalViews: 8432,
    averageViews: 562,
    totalComments: 127,
    changeRate: {
      mentions: 2,
      views: 1247,
      comments: 15,
      positive: 1,
      negative: 1
    }
  };

  const tabs = [
    { id: 'overview', label: '개요', icon: Eye },
    { id: 'negative', label: '부정 언급', icon: AlertTriangle, count: clinicData.negativeMentions },
    { id: 'positive', label: '긍정 언급', icon: TrendingUp, count: clinicData.positiveMentions },
    { id: 'opportunity', label: '기회 게시글', icon: Plus, count: 2 },
    { id: 'trends', label: '트렌드', icon: TrendingUp }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">🏥 내이튼치과 모니터링</h2>
        <p className="text-gray-600">우리 병원에 대한 언급 현황을 실시간으로 모니터링합니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tab.id === 'negative' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 실시간 알림 */}
            <NegativeMentionsAlert />
            
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">총 언급</p>
                    <p className="text-2xl font-bold text-blue-900">{clinicData.totalMentions}건</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+{clinicData.changeRate.mentions}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">긍정 언급</p>
                    <p className="text-2xl font-bold text-green-900">{clinicData.positiveMentions}건</p>
                    <p className="text-sm text-green-600">({Math.round(clinicData.positiveMentions / clinicData.totalMentions * 100)}%)</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+{clinicData.changeRate.positive}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">부정 언급</p>
                    <p className="text-2xl font-bold text-red-900">{clinicData.negativeMentions}건</p>
                    <p className="text-sm text-red-600">({Math.round(clinicData.negativeMentions / clinicData.totalMentions * 100)}%)</p>
                  </div>
                  <div className="flex items-center text-red-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+{clinicData.changeRate.negative}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">총 조회수</p>
                    <p className="text-2xl font-bold text-purple-900">{clinicData.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+{clinicData.changeRate.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">평균 조회수</p>
                    <p className="text-2xl font-bold text-orange-900">{clinicData.averageViews}</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+45</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">댓글 수</p>
                    <p className="text-2xl font-bold text-indigo-900">{clinicData.totalComments}개</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+{clinicData.changeRate.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'negative' && (
          <OurClinicPostsList type="negative" dateRange={dateRange} subject={subject} />
        )}

        {activeTab === 'positive' && (
          <OurClinicPostsList type="positive" dateRange={dateRange} subject={subject} />
        )}

        {activeTab === 'opportunity' && (
          <OurClinicPostsList type="opportunity" dateRange={dateRange} subject={subject} />
        )}

        {activeTab === 'trends' && (
          <OurClinicTrends dateRange={dateRange} subject={subject} />
        )}
      </div>
    </div>
  );
}
