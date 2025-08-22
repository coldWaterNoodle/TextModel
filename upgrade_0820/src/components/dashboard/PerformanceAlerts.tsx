'use client';

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { getPerformanceAlerts, PerformanceAlertRecord } from '@/services/airtable';

interface PerformanceAlertsProps {
  alerts: PerformanceAlertRecord[] | null;
}

const PRIORITY_STYLES: { [key: string]: string } = {
  'High': 'border-red-500',
  'Medium': 'border-yellow-500',
  'Low': 'border-blue-500',
};

export function PerformanceAlerts({ alerts }: PerformanceAlertsProps) {
  return (
    <div className="mt-4 space-y-3">
      {alerts?.map(alert => (
        <div key={alert.id} className={`p-3 border-l-4 ${PRIORITY_STYLES[alert.severity] || 'border-gray-500'} bg-gray-50 rounded-r-lg`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
            <p className={`text-sm font-bold ${alert.description.includes('하락') ? 'text-red-600' : 'text-green-600'}`}>
              {alert.description}
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
        </div>
      ))}
    </div>
  );
}
