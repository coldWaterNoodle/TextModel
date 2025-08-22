'use client';

import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Plus, Eye, MessageSquare, Clock, Search, Filter } from 'lucide-react';
import { ReviewReportModal } from './ReviewReportModal';

interface Post {
  id: string;
  title: string;
  cafeName: string;
  views: number;
  comments: number;
  postedTime: string;
  content: string;
  treatmentType: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'opportunity';
  urgency?: 'high' | 'medium';
}

interface OurClinicPostsListProps {
  type: 'negative' | 'positive' | 'opportunity';
  dateRange: string;
  subject: string;
}

export function OurClinicPostsList({ type, dateRange, subject }: OurClinicPostsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 가상 데이터 (실제로는 API에서 가져올 데이터)
  const getPostsData = (): Post[] => {
    switch (type) {
      case 'negative':
        return [
          {
            id: '1',
            title: '치료 후 부작용 발생',
            cafeName: '동탄맘들 모여라',
            views: 156,
            comments: 8,
            postedTime: '2시간 전',
            content: '신경치료 후 계속 아파요',
            urgency: 'high',
            treatmentType: '신경치료',
            keywords: ['부작용', '통증'],
            sentiment: 'negative'
          },
          {
            id: '2',
            title: '과잉진료 의심',
            cafeName: '대구치과추천',
            views: 89,
            comments: 5,
            postedTime: '5시간 전',
            content: '불필요한 치료를 권하는 것 같아요',
            urgency: 'medium',
            treatmentType: '충치치료',
            keywords: ['과잉진료', '불필요한 치료'],
            sentiment: 'negative'
          }
        ];
      case 'positive':
        return [
          {
            id: '3',
            title: '내이튼치과 추천해요',
            cafeName: '동탄2신도시 분양정보',
            views: 432,
            comments: 12,
            postedTime: '1일 전',
            content: '친절하고 설명이 잘돼요',
            treatmentType: '임플란트',
            keywords: ['친절', '설명'],
            sentiment: 'positive'
          },
          {
            id: '4',
            title: '신경치료 잘했어요',
            cafeName: '동탄맘들 모여라',
            views: 298,
            comments: 6,
            postedTime: '2일 전',
            content: '통증이 많이 줄었어요',
            treatmentType: '신경치료',
            keywords: ['통증 감소', '만족'],
            sentiment: 'positive'
          }
        ];
      case 'opportunity':
        return [
          {
            id: '5',
            title: '임플란트 추천 부탁드려요',
            cafeName: '동탄맘들 모여라',
            views: 89,
            comments: 3,
            postedTime: '3시간 전',
            content: '임플란트 잘하는 곳 추천해주세요',
            treatmentType: '임플란트',
            keywords: ['임플란트', '추천'],
            sentiment: 'neutral'
          },
          {
            id: '6',
            title: '교정치과 어디가 좋을까요?',
            cafeName: '동탄2신도시 분양정보',
            views: 156,
            comments: 7,
            postedTime: '6시간 전',
            content: '교정 잘하는 치과 찾고 있어요',
            treatmentType: '교정치료',
            keywords: ['교정', '추천'],
            sentiment: 'neutral'
          }
        ];
      default:
        return [];
    }
  };

  const posts: Post[] = getPostsData();

  const getTypeInfo = () => {
    switch (type) {
      case 'negative':
        return {
          title: '🚨 부정 언급',
          description: '우리 병원에 대한 부정적인 언급이 있는 게시글입니다.',
          icon: AlertTriangle,
          color: 'red'
        };
      case 'positive':
        return {
          title: '✅ 긍정 언급',
          description: '우리 병원에 대한 긍정적인 언급이 있는 게시글입니다.',
          icon: TrendingUp,
          color: 'green'
        };
      case 'opportunity':
        return {
          title: ' 기회 게시글',
          description: '우리 병원이 언급되지 않았지만 홍보 기회가 있는 게시글입니다.',
          icon: Plus,
          color: 'blue'
        };
    }
  };

  const typeInfo = getTypeInfo();
  const Icon = typeInfo.icon;

  const handleReviewReport = (post: Post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.cafeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 text-${typeInfo.color}-500`} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{typeInfo.title}</h3>
          <p className="text-sm text-gray-600">{typeInfo.description}</p>
        </div>
        <span className={`px-3 py-1 text-sm bg-${typeInfo.color}-100 text-${typeInfo.color}-800 rounded-full`}>
          {posts.length}건
        </span>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="게시글 제목, 카페명, 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          필터
        </button>
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div 
            key={post.id} 
            className={`border rounded-lg p-4 flex items-start justify-between ${
              type === 'negative' 
                ? 'border-red-200 bg-red-50' 
                : type === 'positive'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">{post.title}</h4>
                {post.urgency && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.urgency === 'high' 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {post.urgency === 'high' ? '긴급' : '보통'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.postedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    조회수 {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    댓글 {post.comments}개
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  📍 {post.cafeName} | 🦷 {post.treatmentType}
                </p>
                
                <p className="text-sm text-gray-800 mb-3">
                  📝 {post.content}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">키워드:</span>
                  {post.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleReviewReport(post)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  검토보고서
                </button>
                <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                  상세보기
                </button>
              </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>해당하는 게시글이 없습니다.</p>
          </div>
        )}
      </div>

      {showModal && selectedPost && (
        <ReviewReportModal 
          post={selectedPost} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}
