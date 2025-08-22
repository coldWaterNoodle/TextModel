'use client';

import { useState } from 'react';
import { KpiCard } from '@/components/channels/KpiCard';
import { CafeReportRow } from '@/services/airtable';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IssueReportDialog } from '@/components/channels/IssueReportDialog';

interface CafeIssueSummaryCardProps {
    issueReport: CafeReportRow[];
}

export function CafeIssueSummaryCard({ issueReport }: CafeIssueSummaryCardProps) {
    const [issueDialogOpen, setIssueDialogOpen] = useState(false);

    return (
        <>
            <KpiCard
                title="카페 이슈 탐지"
                value={`부정 ${issueReport.length}건`}
                description="최근 4주 부정 게시글 수"
                changeType="action"
                icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
                valueClassName="text-red-600"
                footer={
                    <Button variant="destructive" size="sm" onClick={() => setIssueDialogOpen(true)} disabled={issueReport.length === 0}>
                        검토 보고서 확인
                    </Button>
                }
            />
            <IssueReportDialog
                report={issueReport.length > 0 ? issueReport[0] : null}
                open={issueDialogOpen}
                onOpenChange={setIssueDialogOpen}
            />
        </>
    );
}
