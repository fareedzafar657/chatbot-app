import { type ReactNode } from 'react';
import { KaiLogo } from '../common/KaiLogo';
import { SidebarUserFooter } from './SidebarUserFooter';

interface SidebarShellProps {
  children: ReactNode;
}

export function SidebarShell({ children }: SidebarShellProps) {
  return (
    <div className="w-[260px] flex-shrink-0 h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
        <KaiLogo size={28} />
        <div>
          <div className="text-[15px] font-semibold text-gray-900">K-AI</div>
          <div className="text-[10px] text-gray-400">by Fareed Z.</div>
        </div>
      </div>

      {/* Dynamic middle section */}
      {children}

      {/* User profile */}
      <SidebarUserFooter />
    </div>
  );
}
