'use client';

import React from 'react';
import { X, AlertTriangle, TrendingUp, User, FileText, BarChart3 } from 'lucide-react';

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
}

interface ReviewReportModalProps {
  post: Post;
  onClose: () => void;
}

export function ReviewReportModal({ post, onClose }: ReviewReportModalProps) {
  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">부정 언급 검토 보고서</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">게시글 제목:</span>
                <p className="text-blue-900 mt-1">{post.title}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">카페:</span>
                <p className="text-blue-900 mt-1">{post.cafeName}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">조회수:</span>
                <p className="text-blue-900 mt-1">{post.views}회 (급상승)</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">댓글 수:</span>
                <p className="text-blue-900 mt-1">{post.comments}개</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">게시 시간:</span>
                <p className="text-blue-900 mt-1">{post.postedTime}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">진료과목:</span>
                <p className="text-blue-900 mt-1">{post.treatmentType}</p>
              </div>
            </div>
          </div>

          {/* 부정 언급 분석 */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              부정 언급 분석
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-red-700">언급 내용:</span>
                <p className="text-red-900 mt-1">{post.content}</p>
              </div>
              <div>
                <span className="font-medium text-red-700">어투 분석:</span>
                <p className="text-red-900 mt-1">불만/항의성 어투, 구체적 증상 언급</p>
              </div>
              <div>
                <span className="font-medium text-red-700">주요 키워드:</span>
                <div className="flex gap-2 mt-1">
                  {post.keywords.map((keyword: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 파급효과 예측 */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              파급효과 예측
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-orange-700">현재 조회수:</span>
                <p className="text-orange-900 mt-1">{post.views}회 (2시간 내)</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">예상 추가 조회:</span>
                <p className="text-orange-900 mt-1">500회 (24시간 내)</p>
              </div>
              <div>
                <span className="font-medium text-orange-700">확산 위험도:</span>
                <p className="text-orange-900 mt-1">높음 (구체적 증상 + 높은 조회수)</p>
              </div>
            </div>
          </div>

          {/* 작성자 분석 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              작성자 분석
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">기존 게시글:</span>
                <p className="text-green-900 mt-1">5건 (치과 관련 3건)</p>
              </div>
              <div>
                <span className="font-medium text-green-700">평균 조회수:</span>
                <p className="text-green-900 mt-1">120회</p>
              </div>
              <div>
                <span className="font-medium text-green-700">평균 댓글:</span>
                <p className="text-green-900 mt-1">8개</p>
              </div>
              <div>
                <span className="font-medium text-green-700">신뢰도:</span>
                <p className="text-green-900 mt-1">보통 (일반 사용자)</p>
              </div>
            </div>
          </div>

          {/* 종합 분석 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              종합 분석
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-purple-700">부정적 파급효과:</span>
                <p className="text-purple-900 mt-1">높음 (구체적 증상 + 높은 조회수)</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">삭제 필요성:</span>
                <p className="text-purple-900 mt-1">즉시 권장</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">대응 방안:</span>
                <p className="text-purple-900 mt-1">의료진 상담 후 정확한 정보 제공</p>
              </div>
              <div>
                <span className="font-medium text-purple-700">예상 효과:</span>
                <p className="text-purple-900 mt-1">부정적 파급효과 70% 감소</p>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            상담 요청
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            삭제 요청하기
          </button>
        </div>
      </div>
    </div>
  );
}
