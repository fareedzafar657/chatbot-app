'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Branch } from '@/lib/types';
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const NODE_W = 168;
const NODE_H = 58;
const H_GAP = 36;
const V_GAP = 88;

function buildChildren(branches: Branch[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  branches.forEach((b) => { map[b.branchId] = []; });
  branches.forEach((b) => {
    if (b.parentBranchId && map[b.parentBranchId]) {
      map[b.parentBranchId].push(b.branchId);
    }
  });
  return map;
}

function subtreeWidth(id: string, children: Record<string, string[]>): number {
  const kids = children[id] ?? [];
  if (kids.length === 0) return 1;
  return kids.reduce((s, k) => s + subtreeWidth(k, children), 0);
}

function assignPositions(
  id: string,
  xUnit: number,
  level: number,
  children: Record<string, string[]>,
  positions: Record<string, { x: number; y: number }>
) {
  const width = subtreeWidth(id, children);
  positions[id] = {
    x: (xUnit + width / 2) * (NODE_W + H_GAP),
    y: level * (NODE_H + V_GAP),
  };
  let offset = xUnit;
  (children[id] ?? []).forEach((kidId) => {
    const kidWidth = subtreeWidth(kidId, children);
    assignPositions(kidId, offset, level + 1, children, positions);
    offset += kidWidth;
  });
}

function layoutBranches(branches: Branch[]): Record<string, { x: number; y: number }> {
  if (branches.length === 0) return {};
  const children = buildChildren(branches);
  const root = branches.find((b) => !b.parentBranchId);
  if (!root) return {};
  const positions: Record<string, { x: number; y: number }> = {};
  assignPositions(root.branchId, 0, 0, children, positions);
  return positions;
}

interface BranchTreeProps {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
}

export function BranchTree({ branches, activeBranchId, onSwitchBranch }: BranchTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const positions = layoutBranches(branches);
  const children = buildChildren(branches);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.4, Math.min(2, prev.scale - e.deltaY * 0.001)),
    }));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => { dragging.current = false; };

  const fitView = () => setTransform({ x: 40, y: 40, scale: 1 });

  // Draw edges
  const edges: React.ReactNode[] = [];
  branches.forEach((branch) => {
    if (!branch.parentBranchId) return;
    const from = positions[branch.parentBranchId];
    const to = positions[branch.branchId];
    if (!from || !to) return;

    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    const midY = (y1 + y2) / 2;

    edges.push(
      <path
        key={`edge-${branch.branchId}`}
        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
        fill="none"
        stroke="#D1D5DB"
        strokeWidth={1.5}
        strokeDasharray={
          branch.branchId === activeBranchId || branch.parentBranchId === activeBranchId
            ? 'none'
            : '4 3'
        }
      />
    );
  });

  // Draw nodes
  const nodes: React.ReactNode[] = branches.map((branch) => {
    const pos = positions[branch.branchId];
    if (!pos) return null;
    const isActive = branch.branchId === activeBranchId;
    const kidCount = (children[branch.branchId] ?? []).length;
    const msgCount = branch.selectedMsgIds.length;

    return (
      <g
        key={branch.branchId}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onSwitchBranch(branch.branchId)}
        style={{ cursor: 'pointer' }}
      >
        <rect
          width={NODE_W}
          height={NODE_H}
          rx={10}
          fill={isActive ? '#4F46E5' : '#FFFFFF'}
          stroke={isActive ? '#4338CA' : '#E5E7EB'}
          strokeWidth={isActive ? 2 : 1}
          filter={
            isActive
              ? 'drop-shadow(0 2px 8px rgba(79,70,229,0.25))'
              : 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))'
          }
        />

        {/* Branch icon */}
        <g transform={`translate(12, ${NODE_H / 2 - 7})`}>
          <rect width={14} height={14} rx={3} fill={isActive ? 'rgba(255,255,255,0.2)' : '#F3F4F6'} />
          <text x={7} y={10} textAnchor="middle" fontSize={8} fill={isActive ? 'white' : '#6B7280'} fontFamily="monospace">
            ⎇
          </text>
        </g>

        {/* Branch label */}
        <text
          x={34}
          y={NODE_H / 2 - 4}
          fontSize={12}
          fontWeight={600}
          fill={isActive ? 'white' : '#111827'}
          fontFamily="Inter, sans-serif"
        >
          {branch.label.length > 14 ? branch.label.slice(0, 13) + '…' : branch.label}
        </text>

        {/* Message count */}
        <text
          x={34}
          y={NODE_H / 2 + 12}
          fontSize={10}
          fill={isActive ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}
          fontFamily="Inter, sans-serif"
        >
          {msgCount} message{msgCount !== 1 ? 's' : ''}
          {kidCount > 0 ? ` · ${kidCount} fork${kidCount > 1 ? 's' : ''}` : ''}
        </text>

        {/* Active badge */}
        {isActive && (
          <>
            <circle cx={NODE_W - 16} cy={NODE_H / 2} r={4} fill="rgba(255,255,255,0.9)" />
            <circle cx={NODE_W - 16} cy={NODE_H / 2} r={2} fill="#4F46E5" />
          </>
        )}
      </g>
    );
  });

  return (
    <div className="relative flex flex-col h-full bg-[#FAFAFA] rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[12px] font-semibold text-gray-700">
            {branches.length} branch{branches.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTransform((p) => ({ ...p, scale: Math.min(2, p.scale + 0.15) }))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.4, p.scale - 0.15) }))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={fitView} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 overflow-hidden" style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F0F0F4" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {edges}
            {nodes}
          </g>
        </svg>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
