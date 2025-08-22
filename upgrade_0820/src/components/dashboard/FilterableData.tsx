'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { getFunnelDailyData, FunnelDataRecord } from '@/services/airtable';
import { SubjectFilter } from '@/components/dashboard/SubjectFilter';
import { DateFilter } from '@/components/dashboard/DateFilter';
import { FunnelVisualization } from '@/components/dashboard/FunnelVisualization';
import { NodeSelector, NODE_LABELS } from '@/components/dashboard/NodeSelector';
import { TimeSeriesChart } from '@/components/dashboard/TimeSeriesChart';
import { format, getWeek, getYear } from 'date-fns';

interface FilterableDataProps {
    initialData: FunnelDataRecord[];
}

export function FilterableData({ initialData }: FilterableDataProps) {
    const [selectedSubject, setSelectedSubject] = useState('전체');
    const [dateRange, setDateRange] = useState('일간');
    const [allDailyData, setAllDailyData] = useState<FunnelDataRecord[] | null>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNode, setSelectedNode] = useState('bookings');

    useEffect(() => {
        // Skip fetching for the initial subject '전체' since we have initialData
        if (selectedSubject === '전체') {
            setAllDailyData(initialData);
            return;
        }

        const fetchFilterableData = async () => {
            setIsLoading(true);
            const funnel = await getFunnelDailyData(selectedSubject);
            setAllDailyData(funnel);
            setIsLoading(false);
        };

        fetchFilterableData();
    }, [selectedSubject, initialData]);

    const timeSeriesData = useMemo(() => {
        if (!allDailyData) return null;

        if (dateRange === '일간') {
            return allDailyData;
        }

        const aggregatedData = allDailyData.reduce((acc, record) => {
            const recordDate = new Date(record.Date);
            let key = '';

            if (dateRange === '주간') {
                const year = getYear(recordDate);
                const week = getWeek(recordDate, { weekStartsOn: 1 });
                key = `${year}-W${week.toString().padStart(2, '0')}`;
            } else if (dateRange === '월간') {
                key = format(recordDate, 'yyyy-MM');
            }

            if (!acc[key]) {
                const { Date, ...restOfRecord } = record;
                acc[key] = { ...restOfRecord, Date: key, Subject: record.Subject };
            } else {
                Object.keys(record).forEach((field) => {
                    const keyOfRecord = field as keyof FunnelDataRecord;
                    if (typeof record[keyOfRecord] === 'number') {
                        (acc[key][keyOfRecord] as number) = ((acc[key][keyOfRecord] as number) || 0) + (record[keyOfRecord] as number);
                    }
                });
            }
            return acc;
        }, {} as { [key: string]: FunnelDataRecord });

        return Object.values(aggregatedData).sort((a, b) => a.Date.localeCompare(b.Date));
    }, [allDailyData, dateRange]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <SubjectFilter selectedSubject={selectedSubject} onSelectSubject={setSelectedSubject} />
                <DateFilter selectedRange={dateRange} onSelectRange={setDateRange} />
            </div>

            {isLoading ? (
                <div>데이터 분석 로딩 중...</div>
            ) : (
                <>
                    {timeSeriesData && (
                        <>
                            <Suspense fallback={<div>Loading Funnel...</div>}>
                                <FunnelVisualization timeSeriesData={timeSeriesData} />
                            </Suspense>

                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800">시계열 트렌드 분석</h3>
                                <NodeSelector selectedNode={selectedNode} onSelectNode={setSelectedNode} />
                                <TimeSeriesChart
                                    data={timeSeriesData}
                                    selectedNodeKey={selectedNode}
                                    nodeLabel={NODE_LABELS[selectedNode]}
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
