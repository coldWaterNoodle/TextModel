'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IssueData {
  type: '긍정' | '부정' | '중립';
  title: string;
  description: string;
  impact: '높음' | '보통' | '낮음';
  timestamp: string;
}

interface ChannelIssueCardProps {
  channel: string;
  issue: IssueData | null;
}

export function ChannelIssueCard({ channel, issue }: ChannelIssueCardProps) {
  if (!issue) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          {channel} 주요 이슈
        </h2>
        <div className="text-center py-8 text-gray-500">
          현재 중요한 이슈가 없습니다.
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '긍정':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case '부정':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '긍정':
        return 'bg-green-50 border-green-200';
      case '부정':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case '높음':
        return 'text-red-600 bg-red-100';
      case '보통':
        return 'text-yellow-600 bg-yellow-100';
      case '낮음':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {channel} 주요 이슈
        </h2>
        <div className="flex items-center gap-2">
          {getTypeIcon(issue.type)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(issue.impact)}`}>
            영향도: {issue.impact}
          </span>
        </div>
      </div>
      
      <div className={`p-4 rounded-lg border ${getTypeColor(issue.type)}`}>
        <h3 className="font-semibold text-gray-800 mb-2">{issue.title}</h3>
        <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{issue.type} 이슈</span>
          <span>{new Date(issue.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
