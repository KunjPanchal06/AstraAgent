// ════════════════════════════════════════════════════════════════
// FILE: components/agent/share-dialog.jsx
// PURPOSE: Modal for sharing task trajectories via links or JSON.
// EXPORTS: ShareDialog
// DEPENDS ON: lucide-react, ui/dialog, use-copy
// ════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Share2, Copy, Check, Link2, X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCopyToClipboard } from '@/hooks/use-copy';
import { toast } from 'sonner';
export function ShareDialog({
  open,
  onOpenChange,
  taskId,
  taskInput
}) {
  const {
    copied,
    copy
  } = useCopyToClipboard();
  const {
    shareUrl,
    embedCode
  } = useMemo(() => {
    if (!taskId || typeof window === 'undefined') {
      return {
        shareUrl: '',
        embedCode: ''
      };
    }
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/?task=${taskId}`;
    return {
      shareUrl: url,
      embedCode: `<iframe src="${url}" width="800" height="600" frameborder="0" title="Agent Trajectory"></iframe>`
    };
  }, [taskId]);
  const handleCopyUrl = () => {
    copy(shareUrl);
    toast.success('Share URL copied to clipboard');
  };
  const handleCopyEmbed = () => {
    copy(embedCode);
    toast.success('Embed code copied to clipboard');
  };
  const handleDownloadJson = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/agent/trajectories/${taskId}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trajectory-${taskId.slice(-8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Trajectory JSON downloaded');
    } catch {
      toast.error('Failed to download trajectory');
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-[520px] gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-emerald-500" />
            Share Trajectory
          </DialogTitle>
        <DialogDescription className="sr-only">Share this trajectory</DialogDescription>
          <p className="text-xs text-muted-foreground">
            Share this agent trajectory via URL, embed code, or JSON export
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Task preview */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Task
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs">{taskInput}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge variant="outline" className="h-4 px-1 font-mono text-[9px]">
                ID: {taskId?.slice(-8)}
              </Badge>
            </div>
          </div>

          {/* Share URL */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
              <Link2 className="h-3 w-3 text-emerald-500" />
              Share URL
            </label>
            <div className="flex gap-1.5">
              <Input value={shareUrl} readOnly className="font-mono text-xs" onClick={e => e.target.select()} />
              <Button size="sm" onClick={handleCopyUrl} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Anyone with this URL can view the trajectory (read-only)
            </p>
          </div>

          {/* Embed code */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{'</>'}</code>
              Embed Code
            </label>
            <div className="flex gap-1.5">
              <Input value={embedCode} readOnly className="font-mono text-[10px]" onClick={e => e.target.select()} />
              <Button size="sm" variant="outline" onClick={handleCopyEmbed} className="shrink-0 gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
          </div>

          {/* Download JSON */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <div>
              <p className="text-xs font-medium">Download as JSON</p>
              <p className="text-[10px] text-muted-foreground">
                Full trajectory data for offline analysis
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadJson} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}