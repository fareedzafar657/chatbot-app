'use client';

import { Operation, OP_BUTTONS } from './types';
import { cn } from '@/lib/cn';

interface OperationsPanelProps {
  operation: Operation;
  opName: string;
  selectedCount: number;
  canExecute: boolean;
  onStart: (op: 'fork') => void;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onExecute: () => void;
}

export function OperationsPanel({
  operation,
  opName,
  selectedCount,
  canExecute,
  onStart,
  onCancel,
  onChangeName,
  onExecute,
}: OperationsPanelProps) {
  return (
    <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
      {!operation ? (
        <div className="grid grid-cols-2 gap-1.5">
          {OP_BUTTONS.map(({ op, icon: Icon, label, desc, colorClass, disabled }) => (
            <button
              key={label}
              onClick={() => { if (!disabled) onStart(op); }}
              disabled={disabled}
              title={disabled ? 'Not yet implemented' : undefined}
              className={cn('flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-all', colorClass, disabled && 'cursor-not-allowed opacity-60')}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[12px] font-semibold">{label}</span>
              </div>
              <span className="text-[10px] opacity-70 leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-gray-700">Fork Branch</span>
            <button onClick={onCancel} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
          </div>

          <input
            type="text"
            value={opName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="Branch name…"
            className="w-full px-3 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:bg-white transition-all"
            autoFocus
          />

          <p className="text-[11px] text-gray-400">
            {selectedCount} message{selectedCount !== 1 ? 's' : ''} selected
          </p>

          <button
            onClick={onExecute}
            disabled={!canExecute}
            className={cn(
              'w-full py-2 rounded-xl text-[13px] font-medium transition-all',
              canExecute ? 'bg-[#18181B] hover:bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            Confirm Fork
          </button>
        </div>
      )}
    </div>
  );
}
