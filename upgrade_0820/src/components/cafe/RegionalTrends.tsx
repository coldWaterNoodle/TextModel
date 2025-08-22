'use client';

import React, { useState } from 'react';
import { TrendingUp, BarChart3, Cloud, Trophy, Eye, MessageSquare } from 'lucide-react';

interface RegionalTrendsProps {
  dateRange: string;
  subject: string;
}

export function RegionalTrends({ dateRange, subject }: RegionalTrendsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 가상 데이터 (실제로는 API에서 가져올 데이터)
  const regionalData = {
    totalPosts: 156,
    totalViews: 45847,
    totalClinics: 23,
    changeRate: {
      posts: 12,
      views: 3247,
      clinics: 2
    }
  };

  const clinicRankings = [
    {
      rank: 1,
      name: '동탄하나로치과',
      posts: 25,
      views: 12847,
      positiveRate: 75,
      negativeRate: 15,
      neutralRate: 10
    },
    {
      rank: 2,
      name: '바른이턱치과',
      posts: 18,
      views: 8156,
      positiveRate: 68,
      negativeRate: 22,
      neutralRate: 10
    },
    {
      rank: 3,
      name: '메타폴리스치과',
      posts: 12,
      views: 5429,
      positiveRate: 45,
      negativeRate: 35,
      neutralRate: 20
    },
    {
      rank: 4,
      name: '이즈치과',
      posts: 10,
      views: 4234,
      positiveRate: 60,
      negativeRate: 25,
      neutralRate: 15
    },
    {
      rank: 5,
      name: '광교365리움치과',
      posts: 8,
      views: 3123,
      positiveRate: 55,
      negativeRate: 30,
      neutralRate: 15
    }
  ];

  const timeSeriesData = [
    { date: '01/01', posts: 8, views: 2345 },
    { date: '01/02', posts: 12, views: 3456 },
    { date: '01/03', posts: 6, views: 1890 },
    { date: '01/04', posts: 15, views: 4567 },
    { date: '01/05', posts: 9, views: 2789 },
    { date: '01/06', posts: 11, views: 3345 },
    { date: '01/07', posts: 5, views: 1456 }
  ];

  const wordCloudData = [
    { word: '임플란트', weight: 85 },
    { word: '신경치료', weight: 72 },
    { word: '교정치료', weight: 68 },
    { word: '충치치료', weight: 55 },
    { word: '가격', weight: 48 },
    { word: '추천', weight: 45 },
    { word: '친절', weight: 42 },
    { word: '설명', weight: 38 },
    { word: '통증', weight: 35 },
    { word: '후기', weight: 32 }
  ];

  const tabs = [
    { id: 'overview', label: '개요', icon: BarChart3 },
    { id: 'rankings', label: '병원 순위', icon: Trophy },
    { id: 'trends', label: '트렌드', icon: TrendingUp },
    { id: 'keywords', label: '키워드', icon: Cloud }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">🌍 지역 치과 동향 분석</h2>
        <p className="text-gray-600">지역 내 치과 병원들의 카페 활동 현황을 분석합니다. (내이튼치과 제외)</p>
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 전체 동향 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">총 게시글</p>
                    <p className="text-2xl font-bold text-blue-900">{regionalData.totalPosts}건</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+{regionalData.changeRate.posts}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">총 조회수</p>
                    <p className="text-2xl font-bold text-green-900">{regionalData.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+{regionalData.changeRate.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">언급 병원</p>
                    <p className="text-2xl font-bold text-purple-900">{regionalData.totalClinics}개</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">+{regionalData.changeRate.clinics}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 상위 3개 병원 요약 */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                상위 병원 요약
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clinicRankings.slice(0, 3).map((clinic, index) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-orange-600">#{clinic.rank}</span>
                      <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">게시글:</span>
                        <span className="font-medium">{clinic.posts}건</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">조회수:</span>
                        <span className="font-medium">{clinic.views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">긍정률:</span>
                        <span className="font-medium text-green-600">{clinic.positiveRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 병원 순위 (내이튼치과 제외)</h3>
            <div className="space-y-3">
              {clinicRankings.map((clinic) => (
                <div key={clinic.rank} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">#{clinic.rank}</span>
                        <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {clinic.posts}건
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {clinic.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 font-medium">{clinic.positiveRate}%</p>
                        <p className="text-xs text-gray-500">긍정</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-red-600 font-medium">{clinic.negativeRate}%</p>
                        <p className="text-xs text-gray-500">부정</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 font-medium">{clinic.neutralRate}%</p>
                        <p className="text-xs text-gray-500">중립</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 시계열 트렌드 ({dateRange})</h3>
            
            {/* 시계열 차트 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">게시글 수</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">조회수</span>
                  </div>
                </div>
              </div>
              
              {/* 간단한 막대 차트 */}
              <div className="flex items-end justify-between h-32 gap-2">
                {timeSeriesData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="flex items-end gap-1 w-full">
                      <div 
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{ height: `${(data.posts / 15) * 100}%` }}
                      ></div>
                      <div 
                        className="flex-1 bg-green-500 rounded-t"
                        style={{ height: `${(data.views / 4567) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">총 게시글</p>
                  <p className="text-blue-600 font-bold">
                    {timeSeriesData.reduce((sum, data) => sum + data.posts, 0)}건
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">총 조회수</p>
                  <p className="text-green-600 font-bold">
                    {timeSeriesData.reduce((sum, data) => sum + data.views, 0).toLocaleString()}회
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">☁️ 키워드 분석</h3>
            
            {/* 워드클라우드 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {wordCloudData.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-white font-medium"
                    style={{
                      fontSize: `${12 + (item.weight / 10)}px`,
                      backgroundColor: `hsl(${200 + index * 20}, 70%, 60%)`,
                      opacity: 0.7 + (item.weight / 100) * 0.3
                    }}
                  >
                    {item.word}
                  </span>
                ))}
              </div>
            </div>

            {/* 키워드 상세 분석 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">🔝 상위 키워드</h4>
                <div className="space-y-2">
                  {wordCloudData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">{item.word}</span>
                      <span className="text-sm font-medium text-blue-900">{item.weight}점</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">📊 키워드 분류</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">진료과목:</span>
                    <span className="font-medium">임플란트, 신경치료, 교정치료, 충치치료</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">가격/비용:</span>
                    <span className="font-medium">가격, 비용, 견적</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">서비스 품질:</span>
                    <span className="font-medium">친절, 설명, 후기</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">증상/통증:</span>
                    <span className="font-medium">통증, 아픔, 불편</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
