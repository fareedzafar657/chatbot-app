import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

type ConfirmDialogProps = Readonly<{
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm(): void;
  onCancel(): void;
  variant?: 'default' | 'destructive';
}>;

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-[360px] text-center">

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        </div>

        {/* Copy */}
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-[13px] text-gray-500 mb-5">{description}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-white text-[13px] font-medium transition-colors',
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#18181B] hover:bg-black'
            )}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
