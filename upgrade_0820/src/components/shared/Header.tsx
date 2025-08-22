'use client';

import { Bell, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return '대시보드';
    if (path.startsWith('/channels')) return '채널별 상세 분석';
    if (path.startsWith('/medicontent')) return '메디컨텐츠';
    if (path.startsWith('/cs-support')) return 'CS 지원';
    if (path.startsWith('/settings')) return '설정';
    return '메디로이어';
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-gray-400"/>
            <div>
                <p className="text-sm font-medium text-gray-800">김원장님</p>
                <p className="text-xs text-gray-500">A병원</p>
            </div>
        </div>
      </div>
    </header>
  );
}
