'use client';

// Shared message-preview primitives for the branch modal sub-views.
// MessagePreviewRow  — avatar + role label + truncated content, used inside selectable
//                      rows in CherryPickTab / CompactTab / MessageSelector.
// SelectedPreviewCard — numbered card in the right-hand "selected" preview panel of
//                      CherryPickTab / CompactTab; accent differs (amber vs teal) per view.
// Does NOT own selection/checkbox/click behaviour — callers wrap these in their own
// <button> and provide the surrounding container styling.

import { User } from 'lucide-react';
import { type Message } from '@/shared/types';
import { KaiLogo } from '../../common/KaiLogo';
import { cn } from '@/lib/cn';
import { truncate } from './modal.utils';

const ACCENT_BADGE: Record<'amber' | 'teal', string> = {
  amber: 'bg-amber-100 text-amber-700',
  teal:  'bg-teal-100 text-teal-700',
};

// ─── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ isUser, size, className }: { isUser: boolean; size: number; className?: string }) {
  if (isUser) {
    return (
      <div
        className={cn('flex-shrink-0 rounded-full bg-gray-700 flex items-center justify-center', className)}
        style={{ width: size, height: size }}
      >
        <User className="text-white" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }
  return (
    <div className={cn('flex-shrink-0 rounded overflow-hidden', className)} style={{ width: size, height: size }}>
      <KaiLogo size={size} />
    </div>
  );
}

// ─── Message preview row (avatar + label + content) ──────────────────────────────

interface MessagePreviewRowProps {
  message: Message;
  /** avatar square size in px */
  avatarSize: number;
  /** max chars before truncation */
  truncateAt: number;
  /** tailwind line-clamp class, e.g. 'line-clamp-2' */
  clampClass: string;
  /** label font-size class, e.g. 'text-[10px]' */
  labelClass: string;
  /** content font-size class, e.g. 'text-[11px]' */
  contentClass: string;
  /** appended after the You/K-AI label, e.g. ' · #3' */
  labelSuffix?: string;
  /** extra classes on the avatar wrapper (e.g. 'mt-0.5' to align with a checkbox) */
  avatarClassName?: string;
}

export function MessagePreviewRow({
  message,
  avatarSize,
  truncateAt,
  clampClass,
  labelClass,
  contentClass,
  labelSuffix,
  avatarClassName,
}: MessagePreviewRowProps) {
  const isUser = message.role === 'user';
  return (
    <>
      <Avatar isUser={isUser} size={avatarSize} className={avatarClassName} />
      <div className="flex-1 min-w-0">
        <div className={cn('font-semibold mb-0.5', labelClass, isUser ? 'text-gray-700' : 'text-violet-700')}>
          {isUser ? 'You' : 'K-AI'}{labelSuffix}
        </div>
        <div className={cn('text-gray-600 leading-snug', contentClass, clampClass)}>
          {truncate(message.content, truncateAt)}
        </div>
      </div>
    </>
  );
}

// ─── Numbered selected-preview card ──────────────────────────────────────────────

interface SelectedPreviewCardProps {
  message: Message;
  index: number;
  accent: 'amber' | 'teal';
  truncateAt: number;
  clampClass: string;
}

export function SelectedPreviewCard({ message, index, accent, truncateAt, clampClass }: SelectedPreviewCardProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* Order badge */}
      <div className={cn('flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold', ACCENT_BADGE[accent])}>
        {index + 1}
      </div>
      <MessagePreviewRow
        message={message}
        avatarSize={16}
        truncateAt={truncateAt}
        clampClass={clampClass}
        labelClass="text-[10px]"
        contentClass="text-[11px]"
      />
    </div>
  );
}
