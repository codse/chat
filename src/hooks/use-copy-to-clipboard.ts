import { useState, useCallback } from 'react';

export function useCopyToClipboard({
  timeout = 2000,
}: {
  timeout?: number;
} = {}) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !navigator.clipboard) {
        console.warn('Clipboard API not available');
        return;
      }

      navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeout);
      });
    },
    [timeout]
  );

  return { isCopied, copyToClipboard };
}
