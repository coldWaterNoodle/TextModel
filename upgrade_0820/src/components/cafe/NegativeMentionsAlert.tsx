'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock, Eye, MessageSquare, X } from 'lucide-react';
import { ReviewReportModal } from './ReviewReportModal';

interface NegativePost {
  id: string;
  title: string;
  cafeName: string;
  views: number;
  comments: number;
  postedTime: string;
  content: string;
  urgency: 'high' | 'medium';
  treatmentType: string;
  keywords: string[];
}

export function NegativeMentionsAlert() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NegativePost | null>(null);

  // 가상 데이터 (실제로는 API에서 가져올 데이터)
  const negativePosts: NegativePost[] = [
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
      keywords: ['부작용', '통증']
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
      keywords: ['과잉진료', '불필요한 치료']
    }
  ];

  const handleReviewReport = (post: NegativePost) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">🚨 실시간 부정 언급 알림</h3>
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
            {negativePosts.length}건
          </span>
        </div>

        {negativePosts.map((post) => (
          <div 
            key={post.id} 
            className={`border-l-4 rounded-lg p-4 ${
              post.urgency === 'high' 
                ? 'border-red-500 bg-red-50' 
                : 'border-orange-500 bg-orange-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.urgency === 'high' 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {post.urgency === 'high' ? '긴급' : '보통'}
                  </span>
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
                <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                  삭제요청
                </button>
                <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                  무시
                </button>
              </div>
            </div>
          </div>
        ))}

        {negativePosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>새로운 부정 언급이 없습니다.</p>
          </div>
        )}
      </div>

      {showModal && selectedPost && (
        <ReviewReportModal 
          post={selectedPost} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
