import { Suspense } from 'react';
import AirtableService from '@/services/airtable';
import { CafeMetrics } from '@/components/cafe/CafeMetrics';
import { CafeChartsAndTableDataWrapper } from '@/components/cafe/CafeChartsAndTableDataWrapper';

export default async function CafePage() {
  // Get hospital name for the header only. Other data is fetched in child components.
  const hospitalSettings = await AirtableService.getHospitalSettings();
  const hospitalName = hospitalSettings?.hospitalName || '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">네이버 카페 분석</h1>
          <p className="text-gray-600">지역 내 카페에서 {hospitalName} 언급 현황 및 지역 동향을 모니터링합니다.</p>
        </div>

        {/* 1. 최상단 섹션 (KPI 카드 3개) */}
        <Suspense fallback={<KpiCardsSkeleton />}>
          <CafeMetrics />
        </Suspense>

        {/* 2 & 3. 차트 및 테이블 섹션 */}
        <Suspense fallback={<ChartsAndTableSkeleton />}>
          <CafeChartsAndTableDataWrapper />
        </Suspense>

      </div>
    </div>
  );
}

function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="bg-gray-200 h-36 rounded-lg"></div>
      <div className="bg-gray-200 h-36 rounded-lg"></div>
      <div className="bg-gray-200 h-36 rounded-lg"></div>
    </div>
  );
}

function ChartsAndTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-200 h-80 rounded-xl"></div>
          <div className="lg:col-span-1 bg-gray-200 h-96 rounded-xl"></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
