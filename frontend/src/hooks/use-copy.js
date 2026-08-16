// ════════════════════════════════════════════════════════════════
// FILE: hooks/use-copy.js
// PURPOSE: React hook for copying text to the clipboard.
//          Provides a `copy(text)` function and a `copied` boolean
//          that auto-resets after a configurable timeout.
//          Includes a fallback for non-secure (HTTP) contexts.
// EXPORTS: useCopyToClipboard
// DEPENDS ON: react
// ════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async text => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch {
      // Fallback for non-secure contexts (HTTP) or older browsers
      // Creates a temporary invisible textarea, selects it, and executes 'copy' command
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch {
        return false;
      }
    }
  }, [timeout]);
  return {
    copied,
    copy
  };
}