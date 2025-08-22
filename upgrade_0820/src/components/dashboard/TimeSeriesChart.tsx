'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimeSeriesData {
  Date: string;
  [key: string]: any;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  selectedNodeKey: string;
  nodeLabel: string;
}

export function TimeSeriesChart({ data, selectedNodeKey, nodeLabel }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">데이터가 없습니다.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Date" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={selectedNodeKey}
            name={nodeLabel}
            stroke="#1a5490"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
