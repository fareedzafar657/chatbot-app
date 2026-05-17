'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useChatStore } from '@/lib/store';
import { ChatWindow } from '@/app/components/chat/ChatWindow';
import { BranchModal } from '@/app/components/branch/modal';
import { PageLoader } from '@/app/components/common/PageLoader';

export default function SessionPage() {
  const { sessionId }     = useParams<{ sessionId: string }>();
  const searchParams      = useSearchParams();
  const router            = useRouter();
  const setActiveSession  = useChatStore((s) => s.setActiveSession);
  const sendMessage       = useChatStore((s) => s.sendMessage);
  const isLoadingSessions = useChatStore((s) => s.isLoadingSessions);
  const showBranchModal   = useChatStore((s) => s.showBranchModal);

  const initialPromptRef  = useRef(searchParams.get('q'));
  const isNewChatNavigation = !!initialPromptRef.current;

  useEffect(() => {
    if (isLoadingSessions || isNewChatNavigation) return;
    setActiveSession(sessionId);
  }, [sessionId, isLoadingSessions, isNewChatNavigation, setActiveSession]);

  const sentRef = useRef(false);
  useEffect(() => {
    const prompt = initialPromptRef.current;
    if (isLoadingSessions || !prompt || sentRef.current) return;
    sentRef.current = true;
    router.replace(`/chat/${sessionId}`);
    sendMessage(prompt);
  }, [isLoadingSessions, router, sendMessage, sessionId]);

  if (isLoadingSessions) return <PageLoader />;

  return (
    <>
      <ChatWindow />
      {showBranchModal && <BranchModal />}
    </>
  );
}
