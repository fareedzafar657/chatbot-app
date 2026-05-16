'use client';

import { useChatStore } from '@/lib/store';
import { ChatWindow } from '@/app/components/ChatWindow';
import { BranchModal } from '@/app/components/BranchModal';

export default function ChatPage() {
  const showBranchModal = useChatStore((s) => s.showBranchModal);

  return (
    <>
      <ChatWindow />
      {showBranchModal && <BranchModal />}
    </>
  );
}
