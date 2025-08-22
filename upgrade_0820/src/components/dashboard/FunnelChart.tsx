'use client';

import React, { useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

// Type definitions
interface FunnelData {
  [key: string]: any;
}

interface CustomNodeData {
  title: string;
  value: number | null;
  size: number;
  color: string;
  valueColor?: string;
  contentHtml?: string;
  titleHtml?: string;
}

// Positioning constants
const COL_X = [80, 260, 460, 700, 900, 1100];
const ROW_Y = {
  cafe: 140, brand: 80, general: 300, homepage: 40, blog: 110,
  maplist: 240, ad: 320, detail: 170, booking: 170, request: 170,
};

const PALETTE = {
  general: '#f3f4f6', brand: '#e5e7eb', homepage: '#bfdbfe', blog: '#93c5fd',
  maplist: '#60a5fa', ad: '#3b82f6', detail: '#2563eb', booking: '#1d4ed8',
  request: '#1e40af', cafe: '#4ade80'
};

const scale = (value: number, min = 28, max = 84, domainMax = 10000) => {
  if (!value || value <= 0) return min;
  const r = Math.min(1, value / domainMax);
  return Math.round(min + (max - min) * r);
};

const fmt = (value: any): string => value?.toLocaleString() ?? '0';

const CircleNode = ({ data }: { data: CustomNodeData }) => (
    <div style={{ width: data.size, height: data.size, borderRadius: '50%', border: `4px solid ${data.color}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'relative' }}>
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
        <Handle id="top" type="source" position={Position.Top} style={{ opacity: 0 }} />
        <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: '#111', width: 140, textAlign: 'center', lineHeight: 1.2 }} dangerouslySetInnerHTML={{ __html: data.titleHtml || data.title }} />
        {data.contentHtml ? (
            <div style={{ textAlign: 'center', lineHeight: 1.15, fontSize: 10, fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
        ) : (
            <div style={{ fontSize: 14, fontWeight: 800, color: data.valueColor || data.color }}>{fmt(data.value)}</div>
        )}
    </div>
);

const ArrowEdge = ({ sourceX, sourceY, targetX, targetY, data, markerEnd }: any) => {
    const { color = '#bbb', width = 1 } = data || {};
    const midX = (sourceX + targetX) / 2;
    const path = `M ${sourceX} ${sourceY} Q ${midX} ${sourceY} ${targetX} ${targetY}`;
    return <path d={path} fill="none" stroke={color} strokeWidth={width} markerEnd={markerEnd} />;
};

const TaperEdge = ({ sourceX, sourceY, targetX, targetY, data }: any) => {
    const { colorL = '#bbb', widthStart = 10, label = '' } = data || {};
    const midX = (sourceX + targetX) / 2;
    const path = `M ${sourceX} ${sourceY - widthStart/2} Q ${midX} ${sourceY - widthStart/2} ${targetX} ${targetY - widthStart/2} L ${targetX} ${targetY + widthStart/2} Q ${midX} ${sourceY + widthStart/2} ${sourceX} ${sourceY + widthStart/2} Z`;
    return (
        <g>
            <path d={path} fill={colorL} opacity={0.6} />
            <text x={midX} y={(sourceY + targetY) / 2 - (widthStart / 2 + 8)} textAnchor="middle" fontSize={12} fontWeight={600} fill="#333">{label}</text>
        </g>
    );
};

const nodeTypes = { circle: CircleNode };
const edgeTypes = { taper: TaperEdge, arrow: ArrowEdge };

const baseNode = (id: string, x: number, y: number, props: Partial<CustomNodeData>): Node<CustomNodeData> => ({
    id,
    type: 'circle',
    position: { x, y },
    data: { title: '', value: 0, size: 36, color: '#ccc', ...props },
});

export function FunnelChart({ data, history = [] }: { data: FunnelData, history: FunnelData[] }) {
    const initialNodes: Node<CustomNodeData>[] = useMemo(() => {
        if (!data) return [];
        const maxOf = (key: string, adjust = (v: number) => v) => Math.max(1, ...history.map(m => adjust(m[key] || 0)));
        const cafeSize = Math.round(scale(data.cafe_view, 28, 84, maxOf('cafe_view')) * 0.6);
        
        return [
            baseNode('cafe', COL_X[0], ROW_Y.cafe, { title: '지역 카페 조회수', value: data.cafe_view, color: PALETTE.cafe, size: cafeSize }),
            baseNode('brand', COL_X[1], ROW_Y.brand, { title: '브랜드 키워드', value: data.brand_node_search, color: PALETTE.brand, size: scale(data.brand_node_search, 28, 84, maxOf('brand_node_search')) }),
            baseNode('general', COL_X[1], ROW_Y.general, { title: '일반 키워드', value: data.general_node_search, color: PALETTE.general, size: scale((data.general_node_search || 0) / 10, 28, 84, maxOf('general_node_search', v => v / 10)) }),
            baseNode('homepage', COL_X[2], ROW_Y.homepage, { title: '홈페이지', value: data.homepage_node_total, color: PALETTE.homepage, size: scale(data.homepage_node_total, 28, 84, maxOf('homepage_node_total')) }),
            baseNode('blog', COL_X[2], ROW_Y.blog, { title: '네이버 블로그', value: data.blog_node_total, color: PALETTE.blog, size: scale(data.blog_node_total, 28, 84, maxOf('blog_node_total')) }),
            baseNode('maplist', COL_X[2], ROW_Y.maplist, { title: '네이버 지도', value: null, color: PALETTE.maplist, size: scale(data.place_list_to_detail, 28, 84, maxOf('place_list_to_detail')), contentHtml: `순위: ${data.map_rank || 0}<br/>'동탄치과'` }),
            baseNode('ad', COL_X[2], ROW_Y.ad, { title: '플레이스 광고', value: data.place_ad_node_total, color: PALETTE.ad, size: scale(data.place_ad_node_total, 28, 84, maxOf('place_ad_node_total')) }),
            baseNode('detail', COL_X[3], ROW_Y.detail, { title: '플레이스 상세', value: data.placeDetailPV, color: PALETTE.detail, size: scale(data.placeDetailPV, 28, 84, maxOf('placeDetailPV')) }),
            baseNode('booking', COL_X[4], ROW_Y.booking, { title: '네이버 예약', value: data.bookingPageVisits, color: PALETTE.booking, size: scale(data.bookingPageVisits, 28, 84, maxOf('bookingPageVisits')) }),
            baseNode('request', COL_X[5], ROW_Y.request, { title: '예약 신청', value: data.bookings, color: PALETTE.request, size: scale(data.bookings, 28, 84, maxOf('bookings')) }),
            // Proxy nodes for cafe connections
            baseNode('cafe_home_proxy', COL_X[0] - 40, ROW_Y.cafe + 50, { title: '_홈페이지', value: data.homepage_node_total, color: '#bbf7d0', size: cafeSize, contentHtml: '' }),
            baseNode('cafe_blog_proxy', COL_X[0] + 40, ROW_Y.cafe + 50, { title: '_블로그', value: data.blog_node_total, color: '#86efac', size: cafeSize, contentHtml: '' }),
        ];
    }, [data, history]);

    const initialEdges: Edge[] = useMemo(() => {
        if (!data) return [];
        const values = Object.values(data).filter(v => typeof v === 'number' && v > 0);
        const vmax = Math.max(1, ...values);
        const width = (v: number) => Math.max(8, Math.round(8 + 36 * ((v || 0) / vmax)));

        const edges: Edge[] = [];
        const addEdge = (source: string, target: string, value: number, colorL: string, colorR: string) => {
            if (!value || value <= 0) return;
            edges.push({ id: `${source}-${target}`, source, target, type: 'taper', data: { value, colorL, colorR, widthStart: width(value), label: fmt(value) } });
        };
        const addArrowEdge = (source: string, target: string, color: string, sourceHandle?: string) => {
            edges.push({ id: `${source}-${target}`, source, target, type: 'arrow', sourceHandle, data: { color, width: 1 } });
        }
        
        // Add arrow edges for cafe
        addArrowEdge('general', 'cafe', PALETTE.cafe);
        addArrowEdge('cafe', 'brand', PALETTE.cafe, 'top');
        addArrowEdge('general', 'cafe_home_proxy', '#bbf7d0');
        addArrowEdge('cafe_home_proxy', 'brand', '#bbf7d0', 'top');
        addArrowEdge('general', 'cafe_blog_proxy', '#86efac');
        addArrowEdge('cafe_blog_proxy', 'brand', '#86efac', 'top');

        addEdge('brand', 'homepage', data.brand_to_site_direct, PALETTE.brand, PALETTE.homepage);
        addEdge('brand', 'blog', data.brand_to_blog_direct, PALETTE.brand, PALETTE.blog);
        addEdge('general', 'homepage', data.general_to_site_direct, PALETTE.general, PALETTE.homepage);
        addEdge('general', 'blog', data.general_to_blog_direct, PALETTE.general, PALETTE.blog);
        addEdge('maplist', 'detail', data.place_list_to_detail, PALETTE.maplist, PALETTE.detail);
        addEdge('ad', 'detail', data.place_ad_to_detail, PALETTE.ad, PALETTE.detail);
        addEdge('homepage', 'detail', data.homepage_to_place_detail, PALETTE.homepage, PALETTE.detail);
        addEdge('blog', 'detail', data.blog_to_place_detail, PALETTE.blog, PALETTE.detail);
        addEdge('detail', 'booking', data.place_to_booking_page, PALETTE.detail, PALETTE.booking);
        addEdge('homepage', 'booking', data.homepage_to_booking_page_direct, PALETTE.homepage, PALETTE.booking);
        addEdge('booking', 'request', data.booking_page_to_requests, PALETTE.booking, PALETTE.request);

        return edges;
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
