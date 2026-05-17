'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useChatStore } from '@/lib/store';

export function ErrorToast() {
  const errorMessage = useChatStore((state) => state.errorMessage);
  const dismissError = useChatStore((state) => state.dismissError);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(dismissError, 4000);
    return () => clearTimeout(t);
  }, [errorMessage, dismissError]);

  if (!errorMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm">
      <div className="flex items-start gap-3 bg-[#18181B] text-white px-4 py-3 rounded-xl shadow-lg text-[13px] leading-snug">
        <span className="flex-1">{errorMessage}</span>
        <button
          onClick={dismissError}
          className="flex-shrink-0 mt-0.5 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
