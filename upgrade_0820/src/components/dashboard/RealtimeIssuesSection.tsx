import AirtableService, { getTodayChannelNews, getPerformanceAlerts, CafeReportRow, PlaceReview, PlaceReviewReport, TodayChannelNewsRecord } from '@/services/airtable';
import { ReputationIssues } from '@/components/dashboard/ReputationIssues';
import { ChannelStatus } from '@/components/dashboard/ChannelStatus';
import { PerformanceAlerts } from '@/components/dashboard/PerformanceAlerts';

type PerformanceAlert = Awaited<ReturnType<typeof getPerformanceAlerts>>[number];

export async function RealtimeIssuesSection() {
    // Fetch all necessary data in parallel
    const [channelNews, performanceAlerts, cafeIssues, placeReviewsResult, placeReviewReports] = await Promise.all([
        getTodayChannelNews(), 
        getPerformanceAlerts(),
        AirtableService.getCafeNegativeReportByDate('2025-08-20', '내이튼치과의원'), // Note: Hardcoded
        AirtableService.getPlaceReviews(1, 1000),
        AirtableService.getPlaceReviewReports()
    ]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold mb-4">🚨 실시간 평판 위기</h3>
                <ReputationIssues 
                    cafeIssues={cafeIssues}
                    placeReviews={placeReviewsResult.reviews}
                    placeReviewReports={placeReviewReports}
                />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold">📈 마케팅 채널 현황</h3>
                <ChannelStatus news={channelNews as TodayChannelNewsRecord[]} />
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold">📊 주요 지표 이상 감지</h3>
                <PerformanceAlerts alerts={performanceAlerts as PerformanceAlert[]} />
            </div>
        </div>
    );
}
