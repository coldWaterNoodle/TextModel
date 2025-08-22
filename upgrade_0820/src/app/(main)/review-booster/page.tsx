'use client';

import React, { useState } from 'react';
import { Star, BarChart2, Bell, Settings, Search, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


const StatCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const KeywordBar = ({ keyword, count, percentage }: { keyword: string, count: number, percentage: number }) => (
  <div className="flex items-center">
    <p className="w-28 text-sm text-gray-600 truncate">{keyword}</p>
    <div className="flex-1 bg-gray-200 rounded-full h-4 mr-2">
      <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
    <p className="text-sm font-semibold">{count}회</p>
  </div>
);

export default function ReviewBoosterPage() {
  const [activeTab, setActiveTab] = useState('stats');

  const historyData = [
    { name: '박지은', phone: '010-4085-3865', treatment: '강아지 일반진료', status: '작성완료', sentAt: '2025-08-05 19:36', writtenAt: '2025-08-06 01:46', rating: '10점' },
    { name: '전면구', phone: '010-6670-1580', treatment: '강아지 진료', status: '발송완료', sentAt: '2025-07-21 11:41', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '임플란트', status: '발송완료', sentAt: '2025-06-30 14:42', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '임플란트', status: '발송완료', sentAt: '2025-06-30 14:41', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '제로네이트', status: '발송완료', sentAt: '2025-06-30 14:40', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '임플란트', status: '발송완료', sentAt: '2025-06-30 14:37', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '제로네이트', status: '발송완료', sentAt: '2025-06-30 14:36', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '임플란트', status: '발송완료', sentAt: '2025-06-30 13:51', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '강아지 일반진료', status: '발송완료', sentAt: '2025-06-16 15:10', writtenAt: '작성 전', rating: '작성 전' },
    { name: '전면구', phone: '010-6670-1580', treatment: '소아치료', status: '발송완료', sentAt: '2025-06-16 15:09', writtenAt: '작성 전', rating: '작성 전' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 헤더 좌측 (메뉴 등) - 필요시 추가 */}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">리뷰 부스터</h1>
              <p className="text-sm text-gray-500 mt-1">관리팀 / 팀 선택</p>
            </div>
            {/* 관리팀/팀 선택 드롭다운 등 - 필요시 추가 */}
          </div>
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Bell size={16} /> 알림톡 및 설정
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <BarChart2 size={16} /> 통계 및 내역
              </button>
            </nav>
          </div>
        </div>

        {/* 통계 대시보드 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">통계 대시보드</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="총 알림톡 발송" value="2개" />
            <StatCard title="리뷰 작성률" value="50%" />
            <StatCard title="평균 평점" value="10.0점" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">리뷰 트렌드</h3>
              {/* TODO: 리뷰 트렌드 차트 구현 */}
              <div className="h-64 flex items-center justify-center text-gray-400">
                (리뷰 트렌드 차트 영역)
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">인기 키워드</h3>
                <a href="#" className="text-sm text-indigo-600 hover:underline">전체 보기</a>
              </div>
              <div className="space-y-3">
                <KeywordBar keyword="전문적인 치료" count={2} percentage={100} />
                <KeywordBar keyword="치료 효과" count={1} percentage={50} />
                <KeywordBar keyword="리셉션 친절" count={1} percentage={50} />
                <KeywordBar keyword="재방문 의사" count={1} percentage={50} />
                <KeywordBar keyword="사후 관리" count={1} percentage={50} />
                <KeywordBar keyword="깨끗한 시설" count={1} percentage={50} />
                <KeywordBar keyword="비용" count={1} percentage={50} />
              </div>
            </div>
          </div>
        </div>

        {/* 알림톡 발송 내역 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">알림톡 발송 내역</h2>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="이름, 연락처, 진료내용 검색" 
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>
            <Select defaultValue="10">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개씩 보기</SelectItem>
                <SelectItem value="20">20개씩 보기</SelectItem>
                <SelectItem value="50">50개씩 보기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>진료내용</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>발송일시</TableHead>
                  <TableHead>리뷰작성</TableHead>
                  <TableHead>평점</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{item.treatment}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === '작성완료' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>{item.sentAt}</TableCell>
                    <TableCell>{item.writtenAt}</TableCell>
                    <TableCell>{item.rating}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Eye size={18} className="text-gray-500 cursor-pointer" />
                      <MoreHorizontal size={18} className="text-gray-500 cursor-pointer" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </main>
    </div>
  );
}
