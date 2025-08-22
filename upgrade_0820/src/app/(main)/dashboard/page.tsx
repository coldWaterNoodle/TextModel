
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { RealtimeIssuesSection } from '@/components/dashboard/RealtimeIssuesSection';
import { DataAnalysisSection } from '@/components/dashboard/DataAnalysisSection';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<RealtimeIssuesSkeleton />}>
        <RealtimeIssuesSection />
      </Suspense>

      <hr />

      <Suspense fallback={<DataAnalysisSkeleton />}>
        <DataAnalysisSection />
      </Suspense>
    </div>
  );
}

function RealtimeIssuesSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-1 bg-gray-200 h-32 rounded-xl"></div>
      <div className="lg:col-span-1 bg-gray-200 h-32 rounded-xl"></div>
      <div className="lg:col-span-1 bg-gray-200 h-32 rounded-xl"></div>
    </div>
  );
}

function DataAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-200 h-10 rounded-lg animate-pulse"></div>
        <div className="bg-gray-200 h-10 rounded-lg animate-pulse"></div>
      </div>
      <div className="bg-gray-200 h-64 rounded-xl animate-pulse"></div>
      <div className="bg-gray-200 h-80 rounded-xl animate-pulse"></div>
    </div>
  );
}
