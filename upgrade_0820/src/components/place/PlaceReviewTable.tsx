'use client';

import React, { useState } from 'react';
import { PlaceReview } from '@/services/airtable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const PlaceReviewTable: React.FC<{
  reviews: PlaceReview[];
}> = ({ reviews }) => {
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const pageSize = 10;
  const total = reviews.length;
  const totalPages = Math.ceil(total / pageSize);

  const paginatedReviews = reviews.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    setExpandedRow(null); // 페이지 변경 시 확장된 행 초기화
  };

  const toggleRowExpansion = (reviewId: string) => {
    setExpandedRow(expandedRow === reviewId ? null : reviewId);
  };
  
  const getReportStatusColor = (status: string | undefined, score: number) => {
    if (status === '검토 요청' && score < 3) return 'bg-red-200 text-red-800';
    switch (status) {
        case '검토 요청': return 'bg-gray-200 text-gray-800';
        case '검토 완료': return 'bg-yellow-200 text-yellow-800';
        case '삭제 진행 중': return 'bg-orange-200 text-orange-800';
        case '삭제 완료': return 'bg-green-200 text-green-800';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="lg:col-span-5">
      <CardHeader>
        <CardTitle>방문자 리뷰 목록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작성일</TableHead>
                <TableHead>평점</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>언급 진료</TableHead>
                <TableHead>답변 여부</TableHead>
                <TableHead>검토 현황</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReviews.map((review) => (
                <React.Fragment key={review.ReviewId}>
                  <TableRow
                    className={cn({
                      'bg-pink-100': review.Score < 3,
                    })}
                  >
                    <TableCell>{new Date(review.AuthorAt).toLocaleDateString()}</TableCell>
                    <TableCell>{review.Score}</TableCell>
                    <TableCell 
                      className="cursor-pointer max-w-xs truncate"
                      onClick={() => toggleRowExpansion(review.ReviewId)}
                    >
                      {review.Content}
                    </TableCell>
                    <TableCell>
                      {review.Category && <Badge variant="outline">{review.Category}</Badge>}
                    </TableCell>
                    <TableCell>
                        {review['Reply Status'] && 
                          <Badge className={cn({
                            'bg-gray-200 text-gray-800': review['Reply Status'] === '답변 완료',
                            'bg-green-200 text-green-800': review['Reply Status'] === 'AI 답변 생성하기',
                          })}>
                            {review['Reply Status']}
                          </Badge>
                        }
                    </TableCell>
                    <TableCell>
                        {review['Report Status'] && 
                          <Badge className={getReportStatusColor(review['Report Status'], review.Score)}>
                            {review['Report Status']}
                          </Badge>
                        }
                    </TableCell>
                  </TableRow>
                  {expandedRow === review.ReviewId && (
                    <TableRow>
                      <TableCell colSpan={6} className="whitespace-normal">
                        {review.Content}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                  총 {total}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}개 표시
              </div>
              <div className="flex items-center gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                  >
                      <ChevronLeft className="w-4 h-4" />
                      이전
                  </Button>
                  <span className="text-sm font-medium">{page} / {totalPages}</span>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 2)}
                      disabled={page === totalPages}
                  >
                      다음
                      <ChevronRight className="w-4 h-4" />
                  </Button>
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Skeleton component for PlaceReviewTable
export function TableSkeleton() {
    return (
        <div className="lg:col-span-5">
            <Card>
                <CardHeader>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
