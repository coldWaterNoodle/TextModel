'use client';

import React from 'react';
import { TodayChannelNewsRecord } from '@/services/airtable';
import { Newspaper, MessageSquareQuote, Star, MessageSquareReply } from 'lucide-react';
import Link from 'next/link';

interface ChannelStatusProps {
  news: TodayChannelNewsRecord[];
}

const StatItem = ({ icon, text, count }: { icon: React.ElementType, text: string, count: number }) => {
    const Icon = icon;
    return (
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Icon className="w-8 h-8 text-gray-400 mr-4" />
            <div>
                <p className="text-sm text-gray-600">{text}</p>
                <p className="text-2xl font-bold text-gray-800">{count}<span className="text-lg font-medium ml-1">건</span></p>
            </div>
        </div>
    );
};

export function ChannelStatus({ news }: ChannelStatusProps) {
  
  const getCount = (channel: '네이버 카페' | '플레이스 리뷰', action: '신규 수집' | '댓글 기회' | '답변 필요'): number => {
    const record = news.find(item => item.Channel === channel && item.Action === action);
    return record ? record.Counts : 0;
  };

  const cafeNewPosts = getCount('네이버 카페', '신규 수집');
  const cafeCommentOpportunities = getCount('네이버 카페', '댓글 기회');

  const placeNewReviews = getCount('플레이스 리뷰', '신규 수집');
  const placeReplyNeeded = getCount('플레이스 리뷰', '답변 필요');

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column: Naver Cafe */}
      <Link href="/channels/cafe" className="space-y-3 cursor-pointer group">
        <h4 className="font-semibold text-gray-700 text-sm px-1 group-hover:text-blue-600 transition-colors">네이버 카페 현황</h4>
        <StatItem icon={Newspaper} text="신규 언급 게시물" count={cafeNewPosts} />
        <StatItem icon={MessageSquareQuote} text="언급 기회 게시물" count={cafeCommentOpportunities} />
      </Link>

      {/* Right Column: Place Review */}
      <Link href="/channels/place" className="space-y-3 cursor-pointer group">
        <h4 className="font-semibold text-gray-700 text-sm px-1 group-hover:text-blue-600 transition-colors">플레이스 리뷰 현황</h4>
        <StatItem icon={Star} text="신규 리뷰" count={placeNewReviews} />
        <StatItem icon={MessageSquareReply} text="답변 필요 리뷰" count={placeReplyNeeded} />
      </Link>
    </div>
  );
}
