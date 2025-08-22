'use client';

import { useState, useEffect, useTransition } from 'react';
import { KpiCard } from '@/components/channels/KpiCard';
import { CafePost, CafeReportRow } from '@/services/airtable';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueReportDialog } from '@/components/channels/IssueReportDialog';
import { calculateCafeKpis } from '@/app/(main)/channels/cafe/actions';

type KpiFilter = '전체' | '임플란트' | '신경치료';

interface KpiData {
    share: { value: string; delta: string; };
    views: { value: string; delta: string; };
}

interface KpiCardClientWrapperProps {
    initialKpiData: KpiData;
    issueReport: CafeReportRow[];
    hospitalName: string;
    posts: CafePost[]; // 서버 액션 호출에 필요
}

export function KpiCardClientWrapper({ initialKpiData, issueReport, hospitalName, posts }: KpiCardClientWrapperProps) {
    const [kpiFilter, setKpiFilter] = useState<{ share: KpiFilter; views: KpiFilter }>({ share: '전체', views: '전체' });
    const [kpi, setKpi] = useState(initialKpiData);
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);
    const [isCalculating, startTransition] = useTransition();


    useEffect(() => {
        startTransition(async () => {
            const shareKpiPromise = calculateCafeKpis(posts, hospitalName, kpiFilter.share);
            const viewsKpiPromise = calculateCafeKpis(posts, hospitalName, kpiFilter.views);
            
            const [shareKpi, viewsKpi] = await Promise.all([shareKpiPromise, viewsKpiPromise]);

            setKpi({
                share: shareKpi.share,
                views: viewsKpi.views
            });
        });
    }, [kpiFilter, posts, hospitalName]);
    
    // Top cafes calculation for views card footer
    const topCafes = (posts && posts.length > 0) ? (() => {
        const monthKey = (iso?: string) => (iso || '').slice(0, 7);
        const months = Array.from(new Set(posts.map(r => monthKey(r.date)).filter(Boolean))).sort();
        const lastM = months[months.length - 1];
        const rowsOfLastMonth = lastM ? posts.filter(r => monthKey(r.date) === lastM) : [];
        
        const cafeViews: { [key: string]: number } = {};
        rowsOfLastMonth.forEach(post => {
            if(post.cafeName && post.views) {
                cafeViews[post.cafeName] = (cafeViews[post.cafeName] || 0) + post.views;
            }
        });

        return Object.entries(cafeViews)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name]) => ({ name }));
    })() : [];


    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard
                    title="점유율"
                    value={isCalculating ? '계산 중...' : kpi.share.value}
                    description="최근 4주, 우리 병원 언급 비율"
                    change={isCalculating ? '' : kpi.share.delta}
                    changeType={(kpi.share.delta.startsWith('+') ? 'increase' : 'decrease')}
                    filters={['전체', '임플란트', '신경치료']}
                    selectedFilter={kpiFilter.share}
                    onFilterChange={(v) => setKpiFilter(prev => ({ ...prev, share: v as KpiFilter }))}
                />
                <KpiCard
                    title="조회수"
                    value={isCalculating ? '계산 중...' : `${kpi.views.value}회`}
                    description="최근 4주 총 조회수"
                    change={isCalculating ? '' : kpi.views.delta}
                    changeType={(kpi.views.delta.startsWith('+') ? 'increase' : 'decrease')}
                    filters={['전체', '임플란트', '신경치료']}
                    selectedFilter={kpiFilter.views}
                    onFilterChange={(v) => setKpiFilter(prev => ({ ...prev, views: v as KpiFilter }))}
                    footer={topCafes.length > 0 ? (
                        <div className="flex gap-2">
                            {topCafes.map((c, idx) => (
                                <Button key={idx} variant="outline" size="sm" className="flex-1 truncate">
                                    {c.name.length > 8 ? `${c.name.slice(0, 8)}…` : c.name}
                                </Button>
                            ))}
                        </div>
                    ) : undefined}
                />
                <KpiCard
                    title="이슈 탐지"
                    value={`부정 ${issueReport.length}건`}
                    description="최근 4주 부정 게시글 수"
                    changeType="action"
                    icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                    valueClassName="text-red-600"
                    footer={
                        <Button variant="destructive" size="sm" onClick={() => setIssueDialogOpen(true)}>
                            검토 보고서 확인
                        </Button>
                    }
                />
            </div>
            <IssueReportDialog
                report={issueReport.length > 0 ? issueReport[0] : null}
                open={issueDialogOpen}
                onOpenChange={setIssueDialogOpen}
            />
        </>
    );
}
