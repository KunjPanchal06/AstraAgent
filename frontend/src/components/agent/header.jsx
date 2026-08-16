// ════════════════════════════════════════════════════════════════
// FILE: components/agent/header.jsx
// PURPOSE: Application header for the Dashboard. Displays the app
//          logo, global navigation, and connection status.
// EXPORTS: AgentHeader
// DEPENDS ON: agent-store, lucide-react, react-router-dom
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Activity, Brain, Wifi, WifiOff, Moon, Sun, Zap } from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SettingsDialog } from '@/components/agent/settings-dialog';
import { BenchmarkDialog } from '@/components/agent/benchmark-dialog';
import { UserMenu } from '@/components/agent/user-menu';
const PHASE_COLORS = {
  idle: 'bg-slate-500',
  planner: 'bg-amber-500',
  executor: 'bg-emerald-500',
  critic: 'bg-violet-500',
  replanner: 'bg-rose-500',
  complete: 'bg-sky-500'
};
export function AgentHeader() {
  const {
    connected,
    running,
    currentPhase,
    cycles,
    toolResults
  } = useAgentStore();
  // Lazy init from localStorage (returns false on server to avoid hydration mismatch)
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('agent-theme');
    return stored === 'dark' || !stored && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync the html class + persist preference whenever dark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('agent-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <header className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Brain className="h-5 w-5 text-white" />
            {running && <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>}
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">
              Agentic AI System
            </h1>
            <p className="hidden text-[11px] leading-tight text-muted-foreground sm:block sm:text-xs">
              ReAct · LangGraph Orchestration · Multi-Tool · Memory-Augmented
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Phase</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${PHASE_COLORS[currentPhase] ?? 'bg-slate-500'} ${running ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold capitalize">{currentPhase}</span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 sm:flex">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-bold tabular-nums">{cycles.length}</span>
            <span className="text-[10px] text-muted-foreground">steps</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 md:flex">
            <span className="text-xs font-bold tabular-nums text-emerald-500">{toolResults.length}</span>
            <span className="text-[10px] text-muted-foreground">tools</span>
          </div>

          <Badge variant={connected ? 'default' : 'secondary'} className={`gap-1.5 ${connected ? 'bg-emerald-600 hover:bg-emerald-600 live-pulse' : ''}`}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Live' : 'Offline'}
          </Badge>

          <BenchmarkDialog />
          <SettingsDialog />

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setDark(d => !d)} className="h-8 w-8 rounded-lg border border-border/60 bg-muted/40">
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{dark ? 'Light mode' : 'Dark mode'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <UserMenu />
        </div>
      </div>
    </header>;
}