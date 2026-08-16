// ════════════════════════════════════════════════════════════════
// FILE: components/agent/compare-dialog.jsx
// PURPOSE: UI for side-by-side comparison of multiple agent
//          trajectories or task executions.
// EXPORTS: CompareDialog
// DEPENDS ON: lucide-react, ui/dialog
// ════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { GitCompare, CheckCircle2, XCircle, Zap, Wrench, Clock, RefreshCw, X, Trophy, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
const STATUS_COLORS = {
  completed: 'text-emerald-500 bg-emerald-500/10',
  failed: 'text-rose-500 bg-rose-500/10',
  running: 'text-sky-500 bg-sky-500/10'
};
export function CompareDialog({
  tasks,
  open,
  onOpenChange
}) {
  const [selected, setSelected] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset selection when dialog closes (not opens, to avoid setState-in-effect)
  const handleClose = open => {
    if (!open) {
      setSelected([]);
      setMetrics(null);
    }
    onOpenChange(open);
  };
  const toggleSelect = id => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };
  const runCompare = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/trajectories/compare?ids=${selected.join(',')}`);
      const data = await res.json();
      setMetrics(data.metrics ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  // Find the "winner" for each metric (lower is better for steps/duration/errors, higher for success)
  const winners = metrics ? {
    steps: metrics.reduce((min, m) => m.totalSteps < min.totalSteps ? m : min, metrics[0]).id,
    duration: metrics.reduce((min, m) => m.totalDurationMs < min.totalDurationMs ? m : min, metrics[0]).id,
    errors: metrics.reduce((min, m) => m.errors < min.errors ? m : min, metrics[0]).id,
    tools: metrics.reduce((max, m) => m.toolCalls > max.toolCalls ? m : max, metrics[0]).id
  } : null;
  return <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-w-[900px] gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompare className="h-4 w-4 text-violet-500" />
            Trajectory Comparison
          </DialogTitle>
        <DialogDescription className="sr-only">Compare trajectories</DialogDescription>
          <p className="text-xs text-muted-foreground">
            Select 2-3 tasks to compare their metrics side-by-side
          </p>
        </DialogHeader>

        <div className="scroll-thin max-h-[70vh] overflow-y-auto">
          {!metrics ? (/* Selection phase */
        <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {selected.length}/3 selected
                </span>
                <Button size="sm" onClick={runCompare} disabled={selected.length < 2 || loading} className="gap-1.5">
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare
                </Button>
              </div>
              <div className="space-y-1.5">
                {tasks.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">
                    No tasks available to compare. Run some tasks first.
                  </p> : tasks.map(t => {
              const isSelected = selected.includes(t.id);
              return <button key={t.id} onClick={() => toggleSelect(t.id)} className={cn('flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all', isSelected ? 'border-violet-500/40 bg-violet-500/5' : 'border-border/60 hover:border-border hover:bg-muted/30')}>
                        <div className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-border/60')}>
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-medium">{t.input}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className={cn('h-4 gap-0.5 px-1 text-[9px]', STATUS_COLORS[t.status] ?? 'text-slate-500')}>
                              {t.status}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(t.createdAt).toLocaleString()}
                            </span>
                            {t.replanCount > 0 && <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-rose-500">
                                <RefreshCw className="h-2.5 w-2.5" />
                                {t.replanCount}
                              </Badge>}
                          </div>
                        </div>
                      </button>;
            })}
              </div>
            </div>) : (/* Results phase */
        <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Comparing {metrics.length} trajectories
                </span>
                <Button size="sm" variant="ghost" onClick={() => setMetrics(null)} className="h-7 gap-1.5 text-xs">
                  <X className="h-3 w-3" />
                  Back to selection
                </Button>
              </div>

              {/* Metrics table */}
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-xs">
                  <thead className="border-b border-border/60 bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Metric
                      </th>
                      {metrics.map(m => <th key={m.id} className="px-3 py-2 text-left font-semibold">
                          <div className="space-y-0.5">
                            <div className="line-clamp-1 text-[11px]">{m.input}</div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={cn('h-3.5 gap-0.5 px-1 text-[8px]', STATUS_COLORS[m.status])}>
                                {m.status}
                              </Badge>
                            </div>
                          </div>
                        </th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <MetricRow label="Total Steps" icon={Zap} values={metrics.map(m => ({
                  id: m.id,
                  value: String(m.totalSteps),
                  isWinner: winners?.steps === m.id
                }))} />
                    <MetricRow label="Tool Calls" icon={Wrench} values={metrics.map(m => ({
                  id: m.id,
                  value: String(m.toolCalls),
                  isWinner: winners?.tools === m.id
                }))} />
                    <MetricRow label="Errors" icon={XCircle} values={metrics.map(m => ({
                  id: m.id,
                  value: String(m.errors),
                  isWinner: winners?.errors === m.id
                }))} />
                    <MetricRow label="Replans" icon={RefreshCw} values={metrics.map(m => ({
                  id: m.id,
                  value: String(m.replanCount)
                }))} />
                    <MetricRow label="Total Time" icon={Clock} values={metrics.map(m => ({
                  id: m.id,
                  value: formatDuration(m.totalDurationMs),
                  isWinner: winners?.duration === m.id
                }))} />
                    <MetricRow label="Avg Step" icon={TrendingDown} values={metrics.map(m => ({
                  id: m.id,
                  value: formatDuration(m.avgStepMs)
                }))} />
                    <tr className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium text-muted-foreground">
                        Tools Used
                      </td>
                      {metrics.map(m => <td key={m.id} className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {m.uniqueTools.map(tool => <Badge key={tool} variant="secondary" className="h-4 px-1 text-[8px] font-mono">
                                {tool}
                              </Badge>)}
                          </div>
                        </td>)}
                    </tr>
                    <tr className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium text-muted-foreground">
                        Result
                      </td>
                      {metrics.map(m => <td key={m.id} className="px-3 py-2">
                          <p className="line-clamp-3 text-[11px] text-muted-foreground">
                            {m.result ?? '(no result)'}
                          </p>
                        </td>)}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Winner summary */}
              <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Summary
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Fewest steps: <strong>{metrics.find(m => m.id === winners?.steps)?.input.slice(0, 40)}</strong> ·
                  Fastest: <strong>{metrics.find(m => m.id === winners?.duration)?.input.slice(0, 40)}</strong> ·
                  Most tools: <strong>{metrics.find(m => m.id === winners?.tools)?.input.slice(0, 40)}</strong>
                </p>
              </div>
            </div>)}
        </div>
      </DialogContent>
    </Dialog>;
}
function MetricRow({
  label,
  icon: Icon,
  values
}) {
  return <tr className="border-t border-border/40">
      <td className="px-3 py-2 font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {label}
        </span>
      </td>
      {values.map(v => <td key={v.id} className={cn('px-3 py-2 font-mono tabular-nums', v.isWinner && 'font-bold text-emerald-600 dark:text-emerald-400')}>
          {v.isWinner && <Trophy className="mr-1 inline h-3 w-3 text-amber-500" />}
          {v.value}
        </td>)}
    </tr>;
}
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}