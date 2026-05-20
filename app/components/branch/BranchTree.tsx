'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  BackgroundVariant,
  Handle,
  Position,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Branch } from '@/shared/types';
import { cn } from '@/lib/cn';

// ── Node dimensions — kept here so layout math stays in sync with rendering ──
const NODE_W = 168;
const NODE_H = 58;
const H_GAP  = 60;
const V_GAP  = 88;

// ── Layout ────────────────────────────────────────────────────────────────────

type ChildMap    = Record<string, string[]>;
type PositionMap = Record<string, { x: number; y: number }>;

function buildChildren(branches: Branch[]): ChildMap {
  const map: ChildMap = {};
  branches.forEach((b) => { map[b.branchId] = []; });
  branches.forEach((b) => {
    if (b.parentBranchId && map[b.parentBranchId]) {
      map[b.parentBranchId].push(b.branchId);
    }
  });
  return map;
}

function subtreeWidth(id: string, children: ChildMap): number {
  const kids = children[id] ?? [];
  if (kids.length === 0) return 1;
  return kids.reduce((sum, k) => sum + subtreeWidth(k, children), 0);
}

function assignPositions(
  id: string,
  xUnit: number,
  level: number,
  children: ChildMap,
  positions: PositionMap
) {
  const width = subtreeWidth(id, children);
  positions[id] = {
    x: (xUnit + width / 2) * (NODE_W + H_GAP),
    y: level * (NODE_H + V_GAP),
  };
  let offset = xUnit;
  (children[id] ?? []).forEach((kidId) => {
    assignPositions(kidId, offset, level + 1, children, positions);
    offset += subtreeWidth(kidId, children);
  });
}

function layoutBranches(branches: Branch[]): PositionMap {
  if (branches.length === 0) return {};
  const children = buildChildren(branches);
  const root = branches.find((b) => !b.parentBranchId);
  if (!root) return {};
  const positions: PositionMap = {};
  assignPositions(root.branchId, 0, 0, children, positions);
  return positions;
}

// ── Custom node ───────────────────────────────────────────────────────────────

interface BranchNodeData {
  label: string;
  msgCount: number;
  kidCount: number;
  isActive: boolean;
  onClick: () => void;
}

function BranchNode({ data }: { data: BranchNodeData }) {
  const { label, msgCount, kidCount, isActive, onClick } = data;
  const truncated = label.length > 14 ? label.slice(0, 13) + '…' : label;

  return (
    <div
      onClick={onClick}
      style={{ width: NODE_W, height: NODE_H }}
      className={cn(
        'rounded-[10px] border cursor-pointer flex flex-col justify-center px-3 gap-0.5 select-none transition-shadow',
        isActive
          ? 'bg-indigo-600 border-indigo-700 shadow-[0_2px_8px_rgba(79,70,229,0.25)]'
          : 'bg-white border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-gray-300'
      )}
    >
      <Handle type="target" position={Position.Top}    className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !pointer-events-none" />

      <div className="flex items-center gap-1.5">
        <div className={cn(
          'w-[14px] h-[14px] rounded-[3px] flex items-center justify-center text-[8px] font-mono flex-shrink-0',
          isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        )}>
          ⎇
        </div>
        <span className={cn('text-[12px] font-semibold truncate', isActive ? 'text-white' : 'text-gray-900')}>
          {truncated}
        </span>
        {isActive && (
          <div className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-white/90 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-indigo-600" />
          </div>
        )}
      </div>

      <span className={cn('text-[10px]', isActive ? 'text-white/70' : 'text-gray-400')}>
        {msgCount} message{msgCount !== 1 ? 's' : ''}
        {kidCount > 0 ? ` · ${kidCount} fork${kidCount > 1 ? 's' : ''}` : ''}
      </span>
    </div>
  );
}

// Defined outside component — React Flow requires stable nodeTypes reference
const NODE_TYPES = { branch: BranchNode };

// ── Main component ────────────────────────────────────────────────────────────

interface BranchTreeProps {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
}

export function BranchTree({ branches, activeBranchId, onSwitchBranch }: BranchTreeProps) {
  const childMap = useMemo(() => buildChildren(branches), [branches]);
  const positions = useMemo(() => layoutBranches(branches), [branches]);

  const layoutNodes: Node<BranchNodeData>[] = useMemo(() =>
    branches.map((branch) => ({
      id:       branch.branchId,
      type:     'branch',
      position: positions[branch.branchId],
      data: {
        label:    branch.label,
        msgCount: branch.selectedMsgIds.length,
        kidCount: (childMap[branch.branchId] ?? []).length,
        isActive: branch.branchId === activeBranchId,
        onClick:  () => onSwitchBranch(branch.branchId),
      },
    })),
    [branches, positions, childMap, activeBranchId, onSwitchBranch]
  );

  const [nodes, setNodes] = useState(layoutNodes);

  // Only branch structure in deps — isActive and callbacks update in-place below without resetting positions
  useEffect(() => {
    setNodes(layoutNodes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  // Keep isActive and onClick current without resetting drag positions
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isActive: n.id === activeBranchId,
          onClick:  () => onSwitchBranch(n.id),
        },
      }))
    );
  }, [activeBranchId, onSwitchBranch]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const edges: Edge[] = useMemo(() =>
    branches
      .filter((b) => b.parentBranchId)
      .map((branch) => ({
        id:           `edge-${branch.branchId}`,
        source:       branch.parentBranchId!,
        target:       branch.branchId,
        type:         'default',
        style:        { stroke: '#D1D5DB', strokeWidth: 1.5 },
        animated:     true,
      })),
    [branches]
  );

  return (
    <div className="h-full w-full rounded-xl border border-gray-100 overflow-hidden bg-[#FAFAFA]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={20} color="#F0F0F4" lineWidth={0.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
