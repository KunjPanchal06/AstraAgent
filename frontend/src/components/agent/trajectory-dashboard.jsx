// ════════════════════════════════════════════════════════════════
// FILE: components/agent/trajectory-dashboard.jsx
// PURPOSE: Displays a list of past agent tasks (trajectories),
//          allowing the user to select, replay, share, or export
//          them as JSON.
// EXPORTS: TrajectoryDashboard
// DEPENDS ON: lucide-react, ui/scroll-area, replay-dialog, share-dialog
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { History, ChevronRight, CheckCircle2, XCircle, Loader2, Clock, RefreshCw, Lightbulb, Wrench, Eye, Flag, Download, Trash2, GitCompare, Play, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrajectorySkeleton } from '@/components/agent/skeletons';
import { CompareDialog } from '@/components/agent/compare-dialog';
import { ReplayDialog } from '@/components/agent/replay-dialog';
import { ShareDialog } from '@/components/agent/share-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const STATUS_CONFIG = {
  completed: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: CheckCircle2,
    label: 'Completed'
  },
  running: {
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    icon: Loader2,
    label: 'Running'
  },
  failed: {
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    icon: XCircle,
    label: 'Failed'
  },
  pending: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    icon: Clock,
    label: 'Pending'
  }
};
const PHASE_ICONS = {
  plan: Flag,
  thought: Lightbulb,
  act: Wrench,
  observe: Eye,
  critique: CheckCircle2,
  replan: RefreshCw,
  final: Flag
};
export function TrajectoryDashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/tasks?limit=50');
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };
  const clearAll = async () => {
    if (!confirm('Delete all tasks, trajectories, and messages? This cannot be undone.')) return;
    await fetch('/api/agent/tasks', {
      method: 'DELETE'
    });
    setTasks([]);
    setDetail(null);
    toast.success('All tasks cleared', {
      description: 'Trajectories and messages deleted.'
    });
  };
  const exportTrajectory = () => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trajectory-${detail.task.id.slice(-8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Trajectory exported', {
      description: `Saved ${detail.trajectory.length} steps as JSON.`
    });
  };
  const [compareOpen, setCompareOpen] = useState(false);
  const [replayTaskId, setReplayTaskId] = useState(null);
  const [replayOpen, setReplayOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/agent/tasks?limit=50').then(r => r.json()).then(data => {
      if (!active) return;
      setTasks(data.tasks ?? []);
      if (data.tasks?.length) {
        setSelectedId(data.tasks[0].id);
      }
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/agent/trajectories/${selectedId}`).then(r => r.json()).then(data => {
      if (!data.error) setDetail(data);
    }).catch(() => {});
  }, [selectedId]);
  return <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[320px_1fr] md:gap-0">
      {/* Task list */}
      <div className="flex max-h-[38%] min-h-0 flex-col border-b border-border/60 md:max-h-none md:border-b-0 md:border-r md:border-border/60">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Past Tasks</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => {
            if (selectedId) {
              setReplayTaskId(selectedId);
              setReplayOpen(true);
            }
          }} disabled={!selectedId} className="h-7 gap-1.5 px-2 text-[11px]" title="Replay trajectory">
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Replay</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShareOpen(true)} disabled={!selectedId} className="h-7 gap-1.5 px-2 text-[11px]" title="Share trajectory">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCompareOpen(true)} disabled={tasks.length < 2} className="h-7 gap-1.5 px-2 text-[11px]" title="Compare trajectories">
              <GitCompare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={exportTrajectory} disabled={!detail} className="h-7 w-7 p-0" title="Export trajectory as JSON">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={loadTasks} className="h-7 w-7 p-0" title="Refresh">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll} disabled={tasks.length === 0} className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600" title="Clear all tasks">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="scroll-thin min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {tasks.length === 0 ? <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No tasks yet.</p>
              </div> : tasks.map(t => {
            const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
            const SIcon = sc.icon;
            const isActive = t.id === selectedId;
            return <button key={t.id} onClick={() => setSelectedId(t.id)} className={cn('group flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all', isActive ? 'border-border bg-muted/60' : 'border-transparent hover:border-border/60 hover:bg-muted/30')}>
                    <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md', sc.bg)}>
                      <SIcon className={cn('h-3.5 w-3.5', sc.color, t.status === 'running' && 'animate-spin')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug">{t.input}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={cn('text-[10px] font-semibold', sc.color)}>{sc.label}</span>
                        {t.replanCount > 0 && <Badge variant="outline" className="h-3.5 gap-0.5 px-1 text-[9px] text-rose-500">
                            <RefreshCw className="h-2.5 w-2.5" />
                            {t.replanCount}×
                          </Badge>}
                        <span className="ml-auto text-[9px] text-muted-foreground">
                          {new Date(t.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={cn('mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', isActive && 'translate-x-0.5')} />
                  </button>;
          })}
          </div>
        </ScrollArea>
      </div>

      {/* Trajectory detail */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-1">
        {detail ? <>
            <div className="shrink-0 border-b border-border/60 px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Task</p>
                  <p className="mt-0.5 text-sm font-medium leading-snug">{detail.task.input}</p>
                </div>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  {detail.trajectory.length} steps
                </Badge>
              </div>
              {detail.task.plan.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.task.plan.map((p, i) => <Badge key={i} variant="secondary" className="gap-1 text-[10px] font-normal">
                      <span className="font-mono text-muted-foreground">{i + 1}.</span>
                      {p.slice(0, 50)}
                    </Badge>)}
                </div>}
            </div>
            <ScrollArea className="scroll-thin min-h-0 flex-1">
              <div className="relative p-4">
                <div className="absolute bottom-2 left-[27px] top-2 w-px bg-border/60" />
                <div className="space-y-2">
                  {detail.trajectory.map(step => <TrajectoryStepView key={step.id} step={step} />)}
                </div>
                {detail.task.result && <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                      Final Result
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">
                      {detail.task.result}
                    </p>
                  </div>}
              </div>
            </ScrollArea>
          </> : <TrajectorySkeleton />}
      </div>

      <CompareDialog tasks={tasks} open={compareOpen} onOpenChange={setCompareOpen} />
      <ReplayDialog open={replayOpen} onOpenChange={setReplayOpen} taskId={replayTaskId} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} taskId={selectedId} taskInput={detail?.task?.input ?? ''} />
    </div>;
}
function TrajectoryStepView({
  step
}) {
  const Icon = PHASE_ICONS[step.phase] ?? Lightbulb;
  const colorMap = {
    plan: 'text-amber-500 bg-amber-500/10',
    thought: 'text-amber-500 bg-amber-500/10',
    act: 'text-emerald-500 bg-emerald-500/10',
    observe: 'text-slate-400 bg-slate-500/10',
    critique: 'text-violet-500 bg-violet-500/10',
    replan: 'text-rose-500 bg-rose-500/10',
    final: 'text-sky-500 bg-sky-500/10'
  };
  return <div className="relative flex gap-3 pb-2">
      <div className={cn('relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background', colorMap[step.phase] ?? 'text-muted-foreground bg-muted/40')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">#{step.stepIndex}</span>
          <span className="text-[11px] font-semibold capitalize">{step.phase}</span>
          {step.status === 'error' && <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-rose-500">
              <XCircle className="h-2.5 w-2.5" /> error
            </Badge>}
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {step.durationMs}ms
          </span>
        </div>
        {step.thought && <p className="mt-1 text-xs leading-relaxed">{step.thought}</p>}
        {step.action && <div className="mt-1 flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-emerald-500" />
            <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {step.action}
            </span>
          </div>}
        {step.actionInput && <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-1.5 font-mono text-[10px] leading-relaxed">
            {JSON.stringify(step.actionInput, null, 2)}
          </pre>}
        {step.observation && <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {step.observation}
          </pre>}
      </div>
    </div>;
}