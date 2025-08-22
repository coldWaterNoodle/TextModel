'use client';

import React, { useState, useEffect } from 'react';
import AirtableService, { CafePost } from '@/services/airtable';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';
import { Area, ComposedChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, Filter, ArrowDownUp, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CafeChartsAndTableProps {
    initialPosts: CafePost[];
    hospitalName: string;
}

export function CafeChartsAndTable({ initialPosts, hospitalName }: CafeChartsAndTableProps) {
    const [dateRange, setDateRange] = useState<'주간' | '월간'>('주간');
    const [subject, setSubject] = useState<'전체' | '임플란트' | '신경치료'>('전체');
    const [rows, setRows] = useState<CafePost[]>(initialPosts);
    const [pieChartData, setPieChartData] = useState<{ name: string; value: number; percentage: number }[]>([]);
    const [chartData, setChartData] = useState<{ date: string; views: number }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = rows.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(rows.length / postsPerPage);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };
    
    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange, subject]);

    // Data fetching on filter change
    useEffect(() => {
        if (!hospitalName) return;
        
        const fetchChartData = async () => {
            setIsLoading(true);
            const now = new Date('2025-08-20');

            // Line/Area Chart Data
            if (dateRange === '주간') {
                const weeklyStats = await AirtableService.getCafeHospitalWeeklyStats(hospitalName, subject);
                const statsByWeek = new Map();
                weeklyStats.forEach(stat => {
                    const date = new Date(stat.weekStart);
                    const monday = new Date(date);
                    monday.setDate(date.getDate() - (date.getDay() || 7) + 1);
                    const weekKey = monday.toISOString().slice(0, 10);
                    statsByWeek.set(weekKey, (statsByWeek.get(weekKey) || 0) + stat.totalViews);
                });
                const weeklyData: { date: string; views: number }[] = [];
                for (let i = 11; i >= 0; i--) {
                    const weekStart = new Date(now);
                    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1 - (i * 7));
                    const weekKey = weekStart.toISOString().slice(0, 10);
                    weeklyData.push({ date: weekKey.slice(5), views: statsByWeek.get(weekKey) || 0 });
                }
                setChartData(weeklyData);
            } else { // '월간'
                const monthlyStats = await AirtableService.getCafeHospitalMonthlyStats(hospitalName, subject);
                const monthlyData: { date: string; views: number }[] = [];
                for (let i = 11; i >= 0; i--) {
                    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = monthStart.toISOString().slice(0, 7);
                    const stat = monthlyStats.find(s => s.month === monthKey);
                    monthlyData.push({ date: monthKey.slice(2), views: stat ? stat.totalViews : 0 });
                }
                setChartData(monthlyData);
            }

            // Pie Chart Data
            let cafeStats = [];
            if (dateRange === '주간') {
                const endDate = now.toISOString().slice(0, 10);
                const startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 84); // 12 weeks
                cafeStats = await AirtableService.getCafeStatsByNameWeekly(hospitalName, subject, startDate.toISOString().slice(0, 10), endDate);
            } else { // '월간'
                const endMonth = now.toISOString().slice(0, 7);
                const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 7);
                cafeStats = await AirtableService.getCafeStatsByNameMonthly(hospitalName, subject, startMonth, endMonth);
            }
            
            const top5 = cafeStats.slice(0, 5);
            const othersViews = cafeStats.slice(5).reduce((sum, c) => sum + c.totalViews, 0);
            const totalViews = cafeStats.reduce((sum, c) => sum + c.totalViews, 0);
            const pieData = top5.map(cafe => ({
                name: cafe.cafeName,
                value: cafe.totalViews,
                percentage: totalViews > 0 ? Math.round((cafe.totalViews / totalViews) * 100) : 0
            }));
            if (othersViews > 0) {
                pieData.push({ name: '기타', value: othersViews, percentage: totalViews > 0 ? Math.round((othersViews / totalViews) * 100) : 0 });
            }
            setPieChartData(pieData);

            setIsLoading(false);
        };

        fetchChartData();
    }, [hospitalName, dateRange, subject]);

    return (
        <>
            {/* 2. 두번째 섹션 (차트 영역) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <DateFilter selectedRange={dateRange} onSelectRange={(v) => setDateRange(v as any)} />
                    <SubjectFilter selectedSubject={subject} onSelectSubject={(value) => setSubject(value as any)} />
                </div>

                {isLoading ? <ChartSkeleton /> : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">종합 성과 분석</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#334155" />
                                        <Tooltip />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="views" name="조회수" fill="#e2e8f0" stroke="#64748b" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">카페별 조회수 분포</h3>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={120} fill="#6B7280" dataKey="value">
                                            {pieChartData.map((entry, index) => {
                                                const grayValue = 107 + (index * 25);
                                                return <Cell key={`cell-${index}`} fill={`rgb(${grayValue}, ${grayValue + 7}, ${grayValue + 14})`} />;
                                            })}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => value.toLocaleString() + '회'} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 세번째 섹션 (테이블) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="게시글 제목, 내용 검색..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Filter className="w-4 h-4" />필터</button>
                        <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><ArrowDownUp className="w-4 h-4" />최신순</button>
                        <button className="px-4 py-2 border rounded-lg flex items-center gap-2"><Download className="w-4 h-4" />내보내기</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table className="table-fixed w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] text-center">순번</TableHead>
                                <TableHead className="w-[80px]">작성일</TableHead>
                                <TableHead className="w-[200px]">제목</TableHead>
                                <TableHead className="w-[120px]">카페명</TableHead>
                                <TableHead className="w-[80px] text-center">조회수</TableHead>
                                <TableHead className="w-[80px] text-center">댓글수</TableHead>
                                <TableHead className="w-[140px]">언급병원명</TableHead>
                                <TableHead className="w-[140px]">언급주제명</TableHead>
                                <TableHead className="w-[100px] text-center">감성분석</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentPosts.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center">데이터가 없습니다.</TableCell></TableRow>
                            ) : (
                                currentPosts.map((r, index) => (
                                    <TableRow key={r.id} className="hover:bg-gray-50">
                                        <TableCell className="text-center whitespace-nowrap">{indexOfFirstPost + index + 1}</TableCell>
                                        <TableCell className="whitespace-nowrap">{new Date(r.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</TableCell>
                                        <TableCell><div className="truncate" title={r.title}><a href={r.link} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">{r.title}</a></div></TableCell>
                                        <TableCell><div className="truncate" title={r.cafeName}>{r.cafeName}</div></TableCell>
                                        <TableCell className="text-center whitespace-nowrap">{r.views?.toLocaleString()}</TableCell>
                                        <TableCell className="text-center whitespace-nowrap">{r.commentsCount}</TableCell>
                                        <TableCell><div className="truncate" title={r.mentionedClinics}>{r.mentionedClinics || '-'}</div></TableCell>
                                        <TableCell><div className="truncate" title={r.relatedTreatments}>{r.relatedTreatments || '-'}</div></TableCell>
                                        <TableCell className="text-center whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs leading-4 font-semibold rounded-full ${r.sentiment === '긍정' ? 'bg-green-100 text-green-800' : r.sentiment === '부정' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {r.sentiment || '중립'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-700">
                            총 {rows.length}개 중 {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, rows.length)}개 표시
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                이전
                            </button>
                            <span className="text-sm">{currentPage} / {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                다음
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function ChartSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 bg-gray-200 h-80 rounded-xl"></div>
            <div className="lg:col-span-1 bg-gray-200 h-96 rounded-xl"></div>
        </div>
    )
}
