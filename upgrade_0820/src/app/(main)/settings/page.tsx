'use client';

import React from 'react';
import Link from 'next/link';
import { Hospital, Users, Link as LinkIcon, Award, CreditCard } from 'lucide-react';

const nav = [
  { name: '병원 정보', href: '/settings/hospital-info', icon: Hospital },
  { name: '사용자 관리', href: '/settings/user-management', icon: Users },
  { name: '시스템 연동', href: '/settings/system-integration', icon: LinkIcon },
  { name: '벤치마크 병원', href: '/settings/benchmark-hospitals', icon: Award },
  { name: '결제 정보', href: '/settings/billing-info', icon: CreditCard },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600">병원 정보, 사용자, 시스템 연동 등 다양한 설정을 관리합니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nav.map(Item => (
            <Link key={Item.name} href={Item.href} className="group bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-blue-200 hover:shadow transition">
              <div className="flex items-center gap-4">
                <Item.icon className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                <div>
                  <div className="text-lg font-semibold text-gray-900">{Item.name}</div>
                  <div className="text-sm text-gray-500">설정을 수정하고 저장합니다.</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
