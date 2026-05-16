import { useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'error';

export function useCopyToClipboard(resetMs = 2000): [CopyState, (text: string) => void] {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), resetMs);
      },
      () => {
        setCopyState('error');
        setTimeout(() => setCopyState('idle'), resetMs);
      }
    );
  };

  return [copyState, copy];
}
