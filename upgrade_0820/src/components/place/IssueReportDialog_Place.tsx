'use client';

import React, { useState } from 'react';
import { PlaceReviewReport } from '@/services/airtable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare, Users, LineChart, ShieldCheck } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface IssueReportDialogPlaceProps {
  reports: PlaceReviewReport[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            {icon}
            <CardTitle className="text-md font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {children || '데이터 없음'}
        </CardContent>
    </Card>
);

export const IssueReportDialog_Place: React.FC<IssueReportDialogPlaceProps> = ({ reports, open, onOpenChange }) => {
  const [showAlert, setShowAlert] = useState(false);
  const report = reports.length > 0 ? reports[0] : null;

  if (!report) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>보고서 없음</DialogTitle>
            </DialogHeader>
            <p className="py-4">표시할 부정 리뷰 검토 보고서가 없습니다.</p>
        </DialogContent>
    </Dialog>
  );

  const handleRequest = () => {
    setShowAlert(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">방문자 리뷰 검토 보고서</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-150px)]">
              <div className="p-4 space-y-4">
                  <Card className="bg-gray-50">
                      <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                              <span>리뷰 정보</span>
                              {report.link && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={report.link} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" /> 원문 보기
                                    </a>
                                </Button>
                              )}
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-600">
                          <div className="grid grid-cols-3 gap-2">
                              <span><strong>게시 채널:</strong> {report.cafeName || 'N/A'}</span>
                              <span><strong>작성자:</strong> {report.author || 'N/A'}</span>
                              <span><strong>작성일:</strong> {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <p className="border-t pt-2 mt-2">{report.content}</p>
                      </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <SectionCard title="내용 분석" icon={<MessageSquare className="h-5 w-5 text-blue-500"/>}>
                          {report.textAnalysis}
                      </SectionCard>
                      <SectionCard title="확산 분석" icon={<LineChart className="h-5 w-5 text-green-500"/>}>
                          {report.metaAnalysis}
                      </SectionCard>
                      <SectionCard title="작성자 분석" icon={<Users className="h-5 w-5 text-purple-500"/>}>
                          {report.authorAnalysis}
                      </SectionCard>
                      <SectionCard title="대응 방안" icon={<ShieldCheck className="h-5 w-5 text-red-500"/>}>
                          {report.recommendation}
                      </SectionCard>
                  </div>
              </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="destructive" onClick={handleRequest}>게시 중단 요청</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>알림</AlertDialogTitle>
            <AlertDialogDescription>
              요청이 접수되었습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>닫기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
