'use client';

import React from 'react';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';

interface OurClinicTrendsProps {
  dateRange: string;
  subject: string;
}

export function OurClinicTrends({ dateRange, subject }: OurClinicTrendsProps) {
  // 가상 데이터 (실제로는 API에서 가져올 데이터)
  const cafeData = [
    { name: '동탄맘들 모여라', posts: 8, views: 3847 },
    { name: '동탄2신도시 분양정보', posts: 5, views: 2156 },
    { name: '대구치과추천', posts: 2, views: 1429 }
  ];

  const treatmentData = [
    { name: '임플란트', posts: 6, views: 3256, percentage: 40 },
    { name: '신경치료', posts: 5, views: 2847, percentage: 33 },
    { name: '교정치료', posts: 3, views: 1568, percentage: 20 },
    { name: '충치치료', posts: 1, views: 761, percentage: 7 }
  ];

  const timeSeriesData = [
    { date: '01/01', mentions: 2, views: 156 },
    { date: '01/02', mentions: 3, views: 234 },
    { date: '01/03', mentions: 1, views: 89 },
    { date: '01/04', mentions: 4, views: 456 },
    { date: '01/05', mentions: 2, views: 198 },
    { date: '01/06', mentions: 3, views: 312 },
    { date: '01/07', mentions: 0, views: 45 }
  ];

  return (
    <div className="space-y-6">
      {/* 카페별 언급 현황 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          카페별 언급 현황 (최근 30일)
        </h3>
        <div className="space-y-3">
          {cafeData.map((cafe, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                <div>
                  <p className="font-medium text-gray-900">{cafe.name}</p>
                  <p className="text-sm text-gray-600">게시글 {cafe.posts}건</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-900">{cafe.views.toLocaleString()} 조회</p>
                <p className="text-sm text-gray-600">평균 {Math.round(cafe.views / cafe.posts)} 조회/건</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 진료과목별 분포 */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          진료과목별 언급 분포
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {treatmentData.map((treatment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">{treatment.name}</p>
                    <p className="text-sm text-gray-600">게시글 {treatment.posts}건</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-900">{treatment.views.toLocaleString()} 조회</p>
                  <p className="text-sm text-gray-600">{treatment.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* 간단한 파이 차트 시각화 */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {treatmentData.map((treatment, index) => {
                  const previousPercentage = treatmentData
                    .slice(0, index)
                    .reduce((sum, t) => sum + t.percentage, 0);
                  const startAngle = (previousPercentage / 100) * 360;
                  const endAngle = ((previousPercentage + treatment.percentage) / 100) * 360;
                  
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${50 + 40 * Math.cos(startAngle * Math.PI / 180)} ${50 + 40 * Math.sin(startAngle * Math.PI / 180)} A 40 40 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${50 + 40 * Math.cos(endAngle * Math.PI / 180)} ${50 + 40 * Math.sin(endAngle * Math.PI / 180)} Z`}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 시계열 트렌드 */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          시계열 트렌드 ({dateRange})
        </h3>
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">언급 수</span>
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
                    style={{ height: `${(data.mentions / 4) * 100}%` }}
                  ></div>
                  <div 
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${(data.views / 456) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.date}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-900">총 언급</p>
              <p className="text-blue-600 font-bold">
                {timeSeriesData.reduce((sum, data) => sum + data.mentions, 0)}건
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

      {/* 주요 인사이트 */}
      <div className="bg-orange-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">💡 주요 인사이트</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">📈 성장 포인트</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 동탄맘들 모여라에서 가장 높은 조회수 달성</li>
              <li>• 임플란트 관련 언급이 가장 많음 (40%)</li>
              <li>• 평균 조회수가 지속적으로 증가 추세</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-orange-900 mb-2">🎯 개선 포인트</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 충치치료 관련 언급이 상대적으로 적음</li>
              <li>• 대구치과추천 카페에서의 활동 부족</li>
              <li>• 주말에는 언급이 적어지는 패턴</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
