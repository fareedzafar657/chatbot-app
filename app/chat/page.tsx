'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { ChatWindow } from '@/app/components/ChatWindow';
import { BranchModal } from '@/app/components/BranchModal';
import { useChatStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';

export default function ChatPage() {
  const router = useRouter();
  const showBranchModal = useChatStore((state) => state.showBranchModal);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar />
      <ChatWindow />
      {showBranchModal && <BranchModal />}
    </div>
  );
}
