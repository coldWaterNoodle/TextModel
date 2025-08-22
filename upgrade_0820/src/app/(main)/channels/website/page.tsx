'use client';

import React, { useState } from 'react';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';

export default function WebsitePage() {
  const [selectedDateRange, setSelectedDateRange] = useState('일간');
  const [selectedSubject, setSelectedSubject] = useState('전체');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">홈페이지 분석</h1>
          <p className="text-gray-600">내이튼치과 홈페이지의 방문자 현황 및 성과를 분석합니다.</p>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <DateFilter 
                selectedRange={selectedDateRange} 
                onSelectRange={setSelectedDateRange} 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">진료과목</label>
              <SubjectFilter 
                selectedSubject={selectedSubject} 
                onSelectSubject={setSelectedSubject} 
              />
            </div>
          </div>
        </div>

        {/* 임시 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚧 홈페이지 분석 페이지 개발 중</h2>
          <p className="text-gray-600">
            홈페이지 분석 기능이 현재 개발 중입니다. 
            방문자 통계, 페이지별 성과, 유입 경로 분석 등의 기능이 포함될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
