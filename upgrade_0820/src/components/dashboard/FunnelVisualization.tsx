'use client';

import React, { useState, useEffect } from 'react';
import { FunnelChart } from './FunnelChart';

interface TimeSeriesData {
  [key: string]: any;
}

export function FunnelVisualization({ timeSeriesData }: { timeSeriesData: TimeSeriesData[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // 데이터가 변경될 때마다 가장 최근 데이터(마지막 인덱스)로 설정
    if (timeSeriesData && timeSeriesData.length > 0) {
      setSelectedIndex(timeSeriesData.length - 1);
    }
  }, [timeSeriesData]);

  if (!timeSeriesData || timeSeriesData.length === 0) {
    return <div className="bg-white p-6 rounded-xl shadow-sm h-96 flex items-center justify-center">분석할 데이터가 없습니다.</div>;
  }

  const selectedData = timeSeriesData[selectedIndex];
  
  if (!selectedData) {
      // This can happen briefly if data updates, render a safe fallback
      return <div className="bg-white p-6 rounded-xl shadow-sm h-96 flex items-center justify-center">데이터 로딩 중...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">통합 퍼널 시각화</h2>
      <div className="h-96">
        <FunnelChart data={selectedData} history={timeSeriesData} />
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-700">
            선택된 기간: {selectedData.Date}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={timeSeriesData.length - 1}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{timeSeriesData[0]?.Date || ''}</span>
          <span>{timeSeriesData[timeSeriesData.length - 1]?.Date || ''}</span>
        </div>
      </div>
    </div>
  );
}
