// ════════════════════════════════════════════════════════════════
// FILE: components/agent/stats-bar.jsx
// PURPOSE: Footer status bar showing active task metrics: steps
//          taken, tools called, memory nodes retrieved.
// EXPORTS: StatsBar
// DEPENDS ON: agent-store, lucide-react
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Activity, Zap, Database, Network, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
const TOOL_COLORS = {
  web_search: 'bg-sky-500',
  calculator: 'bg-emerald-500',
  wikipedia: 'bg-amber-500',
  sql_query: 'bg-violet-500',
  code_execution: 'bg-rose-500',
  knowledge_graph: 'bg-cyan-500'
};
export function StatsBar() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let active = true;
    fetch('/api/agent/stats').then(r => r.json()).then(data => {
      if (active) setStats(data);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!stats) return null;
  const maxToolCount = Math.max(...stats.toolUsage.map(t => t.count), 1);
  return <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-2">
      <StatPill icon={CheckCircle2} label="Tasks" value={stats.tasks.total} sub={`${stats.tasks.successRate}% ok`} color="text-emerald-500" />
      <StatPill icon={Zap} label="Steps" value={stats.steps.total} sub={`avg ${stats.steps.avgPerTask}`} color="text-amber-500" />
      <StatPill icon={Activity} label="Tools" value={stats.steps.toolCalls} sub="calls" color="text-violet-500" />
      <StatPill icon={Database} label="Episodic" value={stats.memory.episodic} sub="memories" color="text-cyan-500" />
      <StatPill icon={Network} label="KG" value={stats.memory.kgNodes} sub={`${stats.memory.kgEdges} edges`} color="text-rose-500" />
      {/* Tool usage mini-bar chart */}
      {stats.toolUsage.length > 0 && <div className="ml-auto hidden items-center gap-2 lg:flex">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Tool usage</span>
          <div className="flex items-end gap-1">
            {stats.toolUsage.map(t => <div key={t.name} className="group relative flex h-6 flex-col justify-end" title={`${t.name}: ${t.count} calls`}>
                <div className={cn('w-4 rounded-sm transition-all hover:opacity-80', TOOL_COLORS[t.name] ?? 'bg-slate-500')} style={{
            height: `${Math.max(t.count / maxToolCount * 100, 15)}%`
          }} />
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                  {t.count}
                </span>
              </div>)}
          </div>
        </div>}
    </div>;
}
function StatPill({
  icon: Icon,
  label,
  value,
  sub,
  color
}) {
  return <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/60 px-2 py-1">
      <Icon className={cn('h-3 w-3', color)} />
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-bold tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-[9px] text-muted-foreground/70">{sub}</span>
    </div>;
}