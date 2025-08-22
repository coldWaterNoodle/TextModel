'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, BarChart3, FileText, MessageSquareWarning, Settings, Hospital, ChevronDown, ChevronRight, Star } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { 
    label: '채널별 상세', 
    icon: BarChart3, 
    children: [
      { href: '/channels/cafe', label: '네이버 카페' },
      { href: '/channels/blog', label: '블로그' },
      { href: '/channels/homepage', label: '홈페이지' },
      { href: '/channels/place', label: '네이버 플레이스' }
    ]
  },
  { href: '/medicontent', label: '메디컨텐츠', icon: FileText },
  { href: '/review-booster', label: '리뷰부스터', icon: Star },
  { href: '/cs-support', label: 'CS 지원', icon: MessageSquareWarning },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['채널별 상세']);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname.startsWith(href);
  };

  const isChildActive = (children?: any[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
            <Hospital className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-gray-800">메디로이어</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.label);
          const isItemActive = hasChildren ? isChildActive(item.children) : isActive(item.href);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${
                        isItemActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors
                            ${
                              isActive(child.href)
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${
                      isItemActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-700">데모 버전입니다.</p>
        </div>
      </div>
    </aside>
  );
}
