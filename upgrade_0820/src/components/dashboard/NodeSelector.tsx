'use client';

import React from 'react';

const NODES = [
  'brand_node_search', 'general_node_search', 'homepage_node_total',
  'blog_node_total', 'place_list_to_detail', 'place_ad_node_total',
  'placeDetailPV', 'bookingPageVisits', 'bookings'
];

export const NODE_LABELS: { [key: string]: string } = {
  brand_node_search: '브랜드 검색',
  general_node_search: '일반 검색',
  homepage_node_total: '홈페이지',
  blog_node_total: '블로그',
  place_list_to_detail: '지도(목록)',
  place_ad_node_total: '플레이스 광고',
  placeDetailPV: '플레이스 상세',
  bookingPageVisits: '예약 페이지',
  bookings: '예약 신청'
};

interface NodeSelectorProps {
  selectedNode: string;
  onSelectNode: (node: string) => void;
}

export function NodeSelector({ selectedNode, onSelectNode }: NodeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {NODES.map(nodeKey => (
        <button
          key={nodeKey}
          onClick={() => onSelectNode(nodeKey)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors
            ${
              selectedNode === nodeKey
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {NODE_LABELS[nodeKey] || nodeKey}
        </button>
      ))}
    </div>
  );
}
