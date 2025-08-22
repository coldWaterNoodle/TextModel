'use client';

import React from 'react';

const SUBJECTS = ['전체', '임플란트', '신경치료'];

interface SubjectFilterProps {
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
}

export function SubjectFilter({ selectedSubject, onSelectSubject }: SubjectFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center bg-white rounded-lg shadow-sm p-2 min-w-[420px]">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors w-full whitespace-nowrap
              ${
                selectedSubject === subject
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-primary/10'
              }`}
          >
            {subject}
          </button>
        ))}
      </div>
    </div>
  );
}
