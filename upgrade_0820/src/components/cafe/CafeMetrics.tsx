'use server';

import AirtableService from '@/services/airtable';
import { KpiCardClientWrapper } from './KpiCardClientWrapper';
import { calculateCafeKpis } from '@/app/(main)/channels/cafe/actions';

export async function CafeMetrics() {
    // Fetch data within the component
    const [posts, hospitalSettings] = await Promise.all([
        AirtableService.getCafePosts(1000),
        AirtableService.getHospitalSettings(),
    ]);
    const hospitalName = hospitalSettings?.hospitalName || '';

    // 이슈 탐지 데이터 Fetch
    const targetDate = '2025-08-20';
    const issueReport = await AirtableService.getCafeNegativeReportByDate(targetDate, hospitalName);

    // 초기 KPI 데이터 계산 (기본값 '전체')
    const initialKpiData = await calculateCafeKpis(posts, hospitalName, '전체');

    return (
        <KpiCardClientWrapper
            initialKpiData={initialKpiData}
            issueReport={issueReport}
            hospitalName={hospitalName}
            posts={posts} // posts는 클라이언트에서 필터 변경 시 재계산을 위해 필요
        />
    );
}
