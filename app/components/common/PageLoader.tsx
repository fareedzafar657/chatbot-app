import { KaiLogo } from '@/app/components/common/KaiLogo';

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white z-50">
      {/* Oval spinner */}
      <div className="relative w-12 h-12">
        <svg
          className="w-12 h-12 animate-spin"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Track */}
          <ellipse cx="24" cy="24" rx="20" ry="20" stroke="#F3F4F6" strokeWidth="3.5" />
          {/* Spinning arc */}
          <ellipse
            cx="24"
            cy="24"
            rx="20"
            ry="20"
            stroke="url(#pg-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="30 96"
          />
          <defs>
            <linearGradient id="pg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
        {/* Logo centred inside spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <KaiLogo size={20} />
        </div>
      </div>
      {label && (
        <p className="text-[13px] text-gray-400 font-medium">{label}</p>
      )}
    </div>
  );
}
