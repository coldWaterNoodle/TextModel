'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComposedChart, Line, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BlogPost { id: string; postId: string; postTitle: string; blogUrl: string; targetKeyword: string; subject: string; publishDate: string; status: string; currentRank?: number; previousRank?: number; totalViews: number; totalInflow: number; conversions?: number; }
interface RankingTrend { weekStart: string; myRank: number; benchmarkHospital?: string; benchmarkRank?: number; }

interface ClientWrapperProps {
  initialPosts: BlogPost[];
}

export function PostsTableClientWrapper({ initialPosts }: ClientWrapperProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingTrends, setRankingTrends] = useState<RankingTrend[]>([]);
  const postsPerPage = 10;
  
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setSelectedPost(null); 
  };
  
  useEffect(() => {
    const fetchRankingTrends = async () => {
      if (selectedPost?.postId) {
        try {
          const response = await fetch(`/api/blog/ranking-trends/${selectedPost.postId}`);
          if (response.ok) setRankingTrends(await response.json());
        } catch (error) { console.error('순위 추이 데이터 조회 실패:', error); setRankingTrends([]); }
      } else {
        setRankingTrends([]);
      }
    };
    fetchRankingTrends();
  }, [selectedPost]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">포스팅 목록</h3>
        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader><TableRow><TableHead className="w-48">제목</TableHead><TableHead className="w-32">타겟키워드</TableHead><TableHead className="w-24">진료과목</TableHead><TableHead className="w-24">게시일</TableHead><TableHead className="w-20">조회수</TableHead><TableHead className="w-24">검색 유입량</TableHead><TableHead className="w-20">전환수</TableHead><TableHead className="w-20">순위</TableHead></TableRow></TableHeader>
            <TableBody>
              {currentPosts.map((post) => (
                <TableRow key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium w-48"><div className="flex items-center gap-2">{post.status === '순위하락' && <AlertCircle className="w-4 h-4 text-orange-500" />}{post.status === '정상' && <CheckCircle className="w-4 h-4 text-green-500" />}<span className="truncate max-w-xs">{post.postTitle}</span></div></TableCell>
                  <TableCell className="w-32 truncate" title={post.targetKeyword}>{post.targetKeyword}</TableCell>
                  <TableCell className="w-24"><span className="px-2 py-1 text-xs rounded-full bg-gray-100">{post.subject || '전체'}</span></TableCell>
                  <TableCell className="w-24">{post.publishDate ? new Date(post.publishDate).toLocaleDateString('ko-KR') : '-'}</TableCell>
                  <TableCell className="w-20">{post.totalViews.toLocaleString()}</TableCell>
                  <TableCell className="w-24">{post.totalInflow.toLocaleString()}</TableCell>
                  <TableCell className="w-20">{post.conversions?.toLocaleString() || '0'}</TableCell>
                  <TableCell className="w-20">{post.currentRank ? <div className="flex items-center gap-1"><span>{post.currentRank}위</span>{post.previousRank && <span className={`text-xs ${post.currentRank < post.previousRank ? 'text-green-500' : post.currentRank > post.previousRank ? 'text-red-500' : 'text-gray-500'}`}>{post.currentRank < post.previousRank ? '↑' : post.currentRank > post.previousRank ? '↓' : '-'}</span>}</div> : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && <div className="flex items-center justify-between mt-4"><div className="text-sm text-gray-700">총 {posts.length}개 중 {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, posts.length)}개 표시</div><div className="flex items-center gap-2"><button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" />이전</button><div className="flex items-center gap-1">{/* Page numbers */}</div><button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50">다음<ChevronRight className="w-4 h-4" /></button></div></div>}
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">포스팅 상세 분석</h3>
        {selectedPost ? (
          <div className="space-y-4">
            <div><h4 className="font-medium text-gray-700 mb-2">{selectedPost.postTitle}</h4><a href={selectedPost.blogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">블로그에서 보기 →</a></div>
            {rankingTrends.length > 0 && <div className="mt-6"><h4 className="font-medium text-gray-700 mb-3">순위 추이</h4><div className="h-64"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={rankingTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="weekStart" tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} />
                <YAxis reversed domain={[1, 'dataMax + 5']} tickFormatter={(value) => `${value}위`} />
                <Tooltip formatter={(value: any) => `${value}위`} />
                <Legend />
                <Line type="monotone" dataKey="myRank" stroke="#8884d8" name="내 포스팅" />
                </ComposedChart></ResponsiveContainer></div></div>}
            <div className="border-t pt-4"><h5 className="font-medium text-gray-700 mb-2">성과 지표</h5><div className="space-y-2"><div className="flex justify-between"><span className="text-sm text-gray-600">총 조회수</span><span className="font-medium">{selectedPost.totalViews.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">총 유입량</span><span className="font-medium">{selectedPost.totalInflow.toLocaleString()}</span></div></div></div>
          </div>
        ) : <div className="h-[400px] flex items-center justify-center text-gray-500">포스팅을 선택하여 상세 정보를 확인하세요.</div>}
      </div>
    </div>
  );
}
