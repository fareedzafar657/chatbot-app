'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { type Session } from '@/lib/types';
import { ConfirmDialog } from './common/ConfirmDialog';

const DEFAULT_SESSION_TITLE = 'New Conversation';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days}d ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function SessionItem({ session, isActive, onSelect, onDelete, onRename }: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title ?? DEFAULT_SESSION_TITLE);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed) onRename(trimmed);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(session.title ?? DEFAULT_SESSION_TITLE);
    }
  };

  if (isEditing) {
    return (
      <div
        className={cn('w-full px-3 py-2.5 rounded-lg flex items-center gap-2.5', isActive ? 'bg-gray-100' : 'bg-gray-50')}
        onClick={(e) => e.stopPropagation()}
      >
        <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-gray-700' : 'text-gray-400')} />
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveRename}
          onKeyDown={handleKeyDown}
          className="flex-1 text-[13px] font-medium bg-transparent outline-none border-b border-gray-300 focus:border-violet-500 text-gray-900 placeholder-gray-400"
          placeholder="Session name..."
        />
      </div>
    );
  }

  return (
    <>
    {confirmingDelete && (
      <ConfirmDialog
        title="Delete conversation"
        description={<>Delete <span className="font-medium text-gray-900">&ldquo;{session.title ?? DEFAULT_SESSION_TITLE}&rdquo;</span>? This cannot be undone.</>}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { setConfirmingDelete(false); onDelete(); }}
        onCancel={() => setConfirmingDelete(false)}
      />
    )}
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 group transition-all duration-100',
        isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0 transition-colors', isActive ? 'text-gray-700' : 'text-gray-400')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className={cn('text-[13px] font-medium truncate leading-snug text-left cursor-text hover:underline', isActive ? 'text-gray-900' : 'text-gray-700')}
          >
            {session.title ?? DEFAULT_SESSION_TITLE}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors -mt-0.5 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-gray-400">{formatRelativeTime(session.updatedAt)}</span>
          {(session.branchCount ?? 0) > 1 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[11px] text-violet-400">{session.branchCount} branches</span>
            </>
          )}
        </div>
      </div>
    </button>
    </>
  );
}
