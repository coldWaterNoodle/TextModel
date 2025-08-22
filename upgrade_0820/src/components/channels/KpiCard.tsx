'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type KpiCardProps = {
    title: string;
    value: string;
    description: string;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'action';
    icon?: React.ReactNode;
    valueClassName?: string;
    footer?: React.ReactNode;
    filters?: string[];
    selectedFilter?: string;
    onFilterChange?: (value: string) => void;
};

export function KpiCard({
    title,
    value,
    description,
    change,
    changeType,
    icon,
    valueClassName,
    footer,
    filters,
    selectedFilter,
    onFilterChange,
}: KpiCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {icon && <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">{icon}</div>}
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                    {filters && onFilterChange && (
                        <Select value={selectedFilter} onValueChange={onFilterChange}>
                            <SelectTrigger className="w-[120px] text-xs h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {filters.map((filter) => (
                                    <SelectItem key={filter} value={filter} className="text-xs">
                                        {filter}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-3xl font-bold mb-1", valueClassName)}>
                    {value}
                </div>
                {change && changeType !== 'action' && (
                    <p className={cn(
                        "text-sm",
                        changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    )}>
                        {change}
                    </p>
                )}
                {footer && <div className="mt-4">{footer}</div>}
            </CardContent>
        </Card>
    );
}
