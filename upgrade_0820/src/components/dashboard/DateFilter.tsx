'use client';

import React from 'react';

const DATE_RANGES = ['주간', '월간'];

interface DateFilterProps {
  selectedRange: string;
  onSelectRange: (range: string) => void;
}

export function DateFilter({ selectedRange, onSelectRange }: DateFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
        {DATE_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => onSelectRange(range)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full
              ${
                selectedRange === range
                  ? 'bg-secondary text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
