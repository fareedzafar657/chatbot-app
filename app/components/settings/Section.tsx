import { type ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex gap-8">
        <div className="w-[220px] flex-shrink-0">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5">{title}</h3>
          {description && (
            <p className="text-[12px] text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
