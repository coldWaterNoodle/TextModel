import { Suspense } from 'react';
import { BlogKpiCards } from '@/components/blog/BlogKpiCards';
import { BlogChartsAndCampaigns } from '@/components/blog/BlogChartsAndCampaigns';
import { BlogPostsTable } from '@/components/blog/BlogPostsTable';

function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm p-6"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-8 bg-gray-200 rounded w-3/4"></div></div>
      <div className="bg-white rounded-lg shadow-sm p-6"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-8 bg-gray-200 rounded w-3/4"></div></div>
      <div className="bg-white rounded-lg shadow-sm p-6"><div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div><div className="h-8 bg-gray-200 rounded w-3/4"></div></div>
    </div>
  );
}

function ChartsAndCampaignsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6"><div className="h-10 bg-gray-200 rounded w-2/3 mb-6"></div><div className="h-80 bg-gray-200 rounded-lg"></div></div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div><div className="space-y-4"><div className="h-24 bg-gray-200 rounded-lg"></div><div className="h-32 bg-gray-200 rounded-lg"></div><div className="h-32 bg-gray-200 rounded-lg"></div></div></div>
    </div>
  );
}

function PostsTableSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6"><div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div><div className="space-y-2">{[...Array(10)].map((_, i) => (<div key={i} className="h-12 bg-gray-200 rounded"></div>))}</div></div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6"><div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div><div className="h-64 bg-gray-200 rounded-lg"></div></div>
    </div>
  );
}


export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">네이버 블로그 분석</h1>
          <p className="text-gray-600">네이버 블로그에서 내이튼치과 언급 현황 및 경쟁 분석을 모니터링합니다.</p>
        </div>

        {/* 1. 최상단 섹션 (KPI 카드 3개) */}
        <Suspense fallback={<KpiCardsSkeleton />}>
          <BlogKpiCards />
        </Suspense>

        {/* 2. 두번째 섹션 (차트와 캠페인) */}
        <Suspense fallback={<ChartsAndCampaignsSkeleton />}>
          <BlogChartsAndCampaigns />
        </Suspense>
        
        {/* 3. 세번째 섹션 (포스팅 목록 및 상세) */}
        <Suspense fallback={<PostsTableSkeleton />}>
          <BlogPostsTable />
        </Suspense>
      </div>
    </div>
  );
}

