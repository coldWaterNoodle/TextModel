'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    PlusCircle,
    Search,
    Filter,
    FileWarning,
    Edit,
    CheckCircle,
    AlertTriangle,
    MessageSquare,
    Upload,
    ArrowRight,
    Send,
    Users,
    ShieldCheck,
    Info,
    HelpCircle,
} from 'lucide-react';

// 실제 Airtable 데이터 사용
import AirtableService, { MedicontentPost } from '@/services/airtable';

export default function MedicontentPage() {
    const [postsData, setPostsData] = useState<MedicontentPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [communications, setCommunications] = useState<any[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const posts = await AirtableService.getPosts();
                setPostsData(posts);
            } catch (error) {
                console.error('포스트 데이터 로드 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    useEffect(() => {
        const fetchCommunications = async () => {
            try {
                const comms = await AirtableService.getRecentActivity();
                setCommunications(comms.slice(0, 4)); // 최근 4개만 표시
            } catch (error) {
                console.error('커뮤니케이션 데이터 로드 실패:', error);
            }
        };

        fetchCommunications();
    }, []);

const getStatusAppearance = (status: string) => {
    switch (status) {
        case '자료 제공 필요':
            return {
                style: 'bg-red-100 text-red-800',
                text: '자료요청',
                icon: <FileWarning size={14} className="mr-1.5" />,
                borderColor: 'border-l-4 border-red-500',
            };
        case '초안 검토 필요':
            return {
                style: 'bg-yellow-100 text-yellow-800',
                text: '검토요청',
                icon: <Edit size={14} className="mr-1.5" />,
                borderColor: 'border-l-4 border-yellow-500',
            };
        case '병원 작업 중':
            return {
                style: 'bg-blue-100 text-blue-800',
                text: '병원 작업중',
                icon: <Edit size={14} className="mr-1.5" />,
                borderColor: 'border-l-4 border-blue-500',
            };
        case '리걸케어 작업 중':
            return {
                style: 'bg-cyan-100 text-cyan-800',
                text: '리걸케어 작업중',
                icon: <ShieldCheck size={14} className="mr-1.5" />,
                borderColor: 'border-l-4 border-cyan-500',
            };
        case '작업 완료':
            return {
                style: 'bg-green-100 text-green-800',
                text: '작업완료',
                icon: <CheckCircle size={14} className="mr-1.5" />,
                borderColor: 'border-l-4 border-green-500',
            };
        default:
            return {
                style: 'bg-gray-100 text-gray-800',
                text: '상태없음',
                icon: null,
                borderColor: 'border-l-4 border-gray-400',
            };
    }
};

const ActionDashboard = ({ posts }: { posts: any[] }) => {
    const router = useRouter();
    const urgentPosts = posts
        .filter((p) => p.status === '자료 제공 필요' || p.status === '초안 검토 필요')
        .slice(0, 5);

    const mockActivity = [
        {
            id: 1,
            type: 'comment',
            author: '리걸케어',
            postTitle: '치근단염, 방치...',
            content: '초안 검토를 요청하였습니다.',
            timestamp: '2시간 전',
            postId: '2',
        },
        {
            id: 2,
            type: 'status_change',
            author: '김민준 원장',
            postTitle: '신경치료, 치수염...',
            content: "포스트 상태를 '발행 대기'로 변경했습니다.",
            timestamp: '8시간 전',
            postId: '1',
        },
        {
            id: 3,
            type: 'file_upload',
            author: '최서원 실장',
            postTitle: '신경치료로 해결되지...',
            content: 'pdf 파일을 업로드했습니다.',
            timestamp: '1일 전',
            postId: '3',
        },
    ];

    const activityIcons = {
        comment: <MessageSquare className="w-5 h-5 text-blue-500" />,
        status_change: <CheckCircle className="w-5 h-5 text-green-500" />,
        file_upload: <Upload className="w-5 h-5 text-purple-500" />,
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urgent Tasks */}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col h-80">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="text-xl font-bold text-gray-800">긴급 처리 필요</h3>
                </div>
                <div className="space-y-3 overflow-y-auto">
                    {urgentPosts.length > 0 ? (
                        urgentPosts.map((post) => {
                            const { style, text, icon } = getStatusAppearance(post.status);
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => router.push(`/medicontent/post-review/${post.id}`)}
                                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate">
                                            {post.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            마감일: {post.publishDate}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center ${style}`}>
                                            {icon} {text}
                                        </span>
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            처리할 긴급 작업이 없습니다.
                        </p>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col h-80">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-800">최근 활동 피드</h3>
                </div>
                <div className="space-y-4 overflow-y-auto">
                    {mockActivity.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => router.push(`/medicontent/post-review/${item.postId}`)}
                            className="flex items-start gap-4 hover:bg-gray-50 p-2 rounded-lg cursor-pointer"
                        >
                            <div className="mt-1 flex-shrink-0">
                                {activityIcons[item.type as keyof typeof activityIcons]}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-600">
                                    <span className="font-bold">{item.author}</span>
                                    님이{' '}
                                    <span className="font-bold text-blue-700">
                                        '{item.postTitle}'
                                    </span>{' '}
                                    포스트에 대해
                                </p>
                                <p className="font-semibold text-sm text-gray-800">
                                    {item.content}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {item.timestamp}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface PostCardProps {
    post: any;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const router = useRouter();
    const { style, text, icon, borderColor } = getStatusAppearance(post.status);

    const handleCardClick = () => {
        router.push(`/medicontent/post-review/${post.id}`);
    };

    const typeStyle =
        post.type === '유입 포스팅'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-indigo-100 text-indigo-800';

    return (
        <div
            onClick={handleCardClick}
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500 border-2 border-transparent transition-all duration-200 ${borderColor}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeStyle}`}>
                    {post.type}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center ${style}`}>
                    {icon}
                    {text}
                </span>
            </div>
            <h3 className="font-semibold text-sm mb-3 text-gray-800">
                {post.title}
            </h3>
            <div className="text-sm text-gray-500 flex items-center justify-end gap-1">
                <Calendar size={14} />
                <span>{post.publishDate ? new Date(post.publishDate).toLocaleDateString('ko-KR') : '날짜 미정'}</span>
            </div>
        </div>
    );
};

    const router = useRouter();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 font-sans flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    const waitingPosts = postsData.filter(
        (p) => p.status === '자료 제공 필요' || p.status === '초안 검토 필요',
    );
    const hospitalInProgressPosts = postsData.filter((p) => p.status === '병원 작업 중');
    const legalcareInProgressPosts = postsData.filter((p) => p.status === '리걸케어 작업 중');
    const completedPosts = postsData.filter((p) => p.status === '작업 완료');



    return (
        <div className="min-h-screen bg-gray-50/50 font-sans">
            <header className="page-header flex flex-col items-start gap-4 px-6 sm:flex-row sm:items-center sm:justify-between md:px-8" style={{ marginBottom: '1.5rem' }}>
                <h1 className="text-2xl font-bold text-gray-900">포스팅 작업</h1>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <button
                        type="button"
                        aria-label="파일 업로드 안내"
                        className="h-9 w-9 flex-shrink-0 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                        <HelpCircle size={18} className="text-white" />
                    </button>
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
                    >
                        <Upload size={16} />
                        <span className="hidden sm:inline">치료 사례 파일 업로드</span>
                    </button>
                </div>
            </header>
            
            <div className="space-y-8">
                {/* 상단 섹션: 대시보드 및 커뮤니케이션 */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 px-6 md:px-8">
                    {/* 왼쪽: 긴급 처리 필요, 최근 활동 피드 */}
                    <div className="xl:col-span-2">
                        <ActionDashboard posts={postsData} />
                    </div>

                    {/* 오른쪽: 실시간 커뮤니케이션 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col h-80">
                        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                            <Users className="w-6 h-6 text-green-500" />
                            <h3 className="text-xl font-bold text-gray-800">실시간 커뮤니케이션</h3>
                        </div>
                                                       <div className="flex-grow bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto">
                                   {communications.length > 0 ? (
                                       communications.map((msg) => (
                                           <div
                                               key={msg.id}
                                               className={`flex items-start gap-2.5 ${msg.sender === 'legalcare' ? 'justify-end' : ''}`}
                                           >
                                               {msg.sender === 'hospital' && (
                                                   <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-700 text-sm flex-shrink-0">
                                                       {msg.senderName.substring(0, 1)}
                                                   </div>
                                               )}
                                               <div className={`flex flex-col w-full max-w-[260px] leading-1.5 p-3 border-gray-200 ${msg.sender === 'legalcare' ? 'bg-blue-100 rounded-l-xl rounded-br-xl' : 'bg-white shadow-sm rounded-r-xl rounded-bl-xl'}`}>
                                                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                       <span className="text-sm font-semibold text-gray-900">
                                                           {msg.senderName}
                                                       </span>
                                                       <span className="text-xs font-normal text-gray-500">
                                                           {new Date(msg.timestamp).toLocaleString('ko-KR', {
                                                               month: 'short',
                                                               day: 'numeric',
                                                               hour: '2-digit',
                                                               minute: '2-digit'
                                                           })}
                                                       </span>
                                                   </div>
                                                   <p className="text-sm font-normal py-2 text-gray-900">
                                                       {msg.content}
                                                   </p>
                                               </div>
                                               {msg.sender === 'legalcare' && (
                                                   <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                                                       리
                                                   </div>
                                               )}
                                           </div>
                                       ))
                                   ) : (
                                       <div className="text-center text-gray-500 py-8">
                                           <MessageSquare size={24} className="mx-auto mb-2" />
                                           <p>커뮤니케이션 내역이 없습니다.</p>
                                       </div>
                                   )}
                               </div>
                        <div className="mt-4 flex items-center gap-2 flex-shrink-0">
                            <input
                                type="text"
                                placeholder="메시지를 입력하세요..."
                                className="flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                            />
                            <button className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 하단 섹션: 콘텐츠 워크플로우 */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 px-6 md:px-8 flex items-center gap-2">
                        포스팅 워크플로우
                        <button
                            type="button"
                            aria-label="포스팅 워크플로우 안내"
                            className="ml-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            <HelpCircle size={18} className="text-white" />
                        </button>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-4 px-6 md:px-8">
                        {/* 대기 Column */}
                        <div>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <h3 className="text-lg text-gray-700">대기</h3>
                                    <span className="text-base font-semibold text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        {waitingPosts.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-xl h-full">
                                    {waitingPosts.length > 0 ? (
                                        waitingPosts.map((post) => (
                                            <PostCard key={post.id} post={post} />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-10">
                                            작업 대기중인 콘텐츠가 없습니다.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 병원 작업 중 Column */}
                        <div>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <h3 className="text-lg text-gray-700">병원 작업 중</h3>
                                    <span className="text-base font-semibold text-white bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        {hospitalInProgressPosts.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-xl h-full">
                                    {hospitalInProgressPosts.length > 0 ? (
                                        hospitalInProgressPosts.map((post) => (
                                            <PostCard key={post.id} post={post} />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-10">
                                            작업 중인 콘텐츠가 없습니다.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 리걸케어 작업 중 Column */}
                        <div>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <h3 className="text-lg text-gray-700">리걸케어 작업 중</h3>
                                    <span className="text-base font-semibold text-white bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        {legalcareInProgressPosts.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-xl h-full">
                                    {legalcareInProgressPosts.length > 0 ? (
                                        legalcareInProgressPosts.map((post) => (
                                            <PostCard key={post.id} post={post} />
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-10">
                                            작업 중인 콘텐츠가 없습니다.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 작업 완료 Column */}
                        <div>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <h3 className="text-lg text-gray-700">작업 완료</h3>
                                    <span className="text-base font-semibold text-white bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        {completedPosts.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-xl h-full">
                                    {/* 블로그 통합 게시 (유입 포스팅) */}
                                    <div className="mb-6">
                                        <h4 className="text-base font-bold text-purple-700 mb-2">
                                            블로그 통합 게시(네이버+홈페이지)
                                        </h4>
                                        {completedPosts.filter((post) => post.type === '유입 포스팅').length > 0 ? (
                                            completedPosts
                                                .filter((post) => post.type === '유입 포스팅')
                                                .map((post) => (
                                                    <PostCard key={post.id} post={post} />
                                                ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">
                                                유입 포스팅이 없습니다.
                                            </p>
                                        )}
                                    </div>
                                    {/* 홈페이지 블로그 게시 (전환 포스팅) */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-2">
                                            <h4 className="text-base font-bold text-indigo-700">
                                                홈페이지 블로그 게시
                                            </h4>
                                            <button
                                                type="button"
                                                aria-label="홈페이지 블로그 게시 안내"
                                                className="ml-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <HelpCircle size={14} className="text-white" />
                                            </button>
                                        </div>
                                        {completedPosts.filter((post) => post.type === '전환 포스팅').length > 0 ? (
                                            completedPosts
                                                .filter((post) => post.type === '전환 포스팅')
                                                .map((post) => (
                                                    <PostCard key={post.id} post={post} />
                                                ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">
                                                전환 포스팅이 없습니다.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
