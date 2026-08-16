// ════════════════════════════════════════════════════════════════
// FILE: components/agent/phase-progress.jsx
// PURPOSE: Visual progress indicator for the agent's current phase
//          (e.g., Plan, Execute, Critique, Done).
// EXPORTS: PhaseProgress
// DEPENDS ON: agent-store, lucide-react, framer-motion
// ════════════════════════════════════════════════════════════════

import { useAgentStore } from '@/lib/agent-store';
import { cn } from '@/lib/utils';
import { ListChecks, Wrench, CheckCircle2, RefreshCw, Flag } from 'lucide-react';
const PHASES = [{
  key: 'planner',
  label: 'Plan',
  icon: ListChecks,
  color: 'amber'
}, {
  key: 'executor',
  label: 'Execute',
  icon: Wrench,
  color: 'emerald'
}, {
  key: 'critic',
  label: 'Critique',
  icon: CheckCircle2,
  color: 'violet'
}, {
  key: 'replanner',
  label: 'Replan',
  icon: RefreshCw,
  color: 'rose'
}, {
  key: 'complete',
  label: 'Done',
  icon: Flag,
  color: 'sky'
}];
const COLOR_MAP = {
  amber: {
    active: 'bg-amber-500 text-white',
    done: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    idle: 'bg-muted/40 text-muted-foreground',
    text: 'text-amber-600 dark:text-amber-400'
  },
  emerald: {
    active: 'bg-emerald-500 text-white',
    done: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    idle: 'bg-muted/40 text-muted-foreground',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  violet: {
    active: 'bg-violet-500 text-white',
    done: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
    idle: 'bg-muted/40 text-muted-foreground',
    text: 'text-violet-600 dark:text-violet-400'
  },
  rose: {
    active: 'bg-rose-500 text-white',
    done: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
    idle: 'bg-muted/40 text-muted-foreground',
    text: 'text-rose-600 dark:text-rose-400'
  },
  sky: {
    active: 'bg-sky-500 text-white',
    done: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
    idle: 'bg-muted/40 text-muted-foreground',
    text: 'text-sky-600 dark:text-sky-400'
  }
};
export function PhaseProgress() {
  const {
    currentPhase,
    running,
    plan,
    currentSubtask
  } = useAgentStore();

  // Determine progress state
  const phaseOrder = ['idle', 'planner', 'executor', 'critic', 'replanner', 'complete'];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  return <div className="flex shrink-0 items-center gap-1.5 border-b border-border/60 bg-muted/20 px-3 py-1.5">
      <div className="flex items-center gap-1">
        {PHASES.map((phase, i) => {
        const phaseIdx = phaseOrder.indexOf(phase.key);
        const isActive = currentPhase === phase.key && running;
        const isDone = currentIdx > phaseIdx && currentPhase !== 'idle';
        const isReplan = phase.key === 'replanner' && currentPhase !== 'replanner';
        // Skip replanner in the visual if it's not relevant
        if (phase.key === 'replanner' && currentPhase !== 'replanner' && currentPhase !== 'complete') {
          return null;
        }
        const colors = COLOR_MAP[phase.color];
        const Icon = phase.icon;
        return <div key={phase.key} className="flex items-center">
              {i > 0 && <div className={cn('mx-0.5 h-px w-3 transition-colors', isDone || isActive ? 'bg-border' : 'bg-border/40')} />}
              <div className="flex items-center gap-1">
                <div className={cn('flex h-5 items-center gap-1 rounded-md px-1.5 transition-all', isActive ? cn(colors.active, 'phase-glow') : isDone ? colors.done : colors.idle)}>
                  <Icon className={cn('h-3 w-3', isActive && 'animate-pulse')} />
                  <span className="text-[10px] font-medium">{phase.label}</span>
                </div>
                {phase.key === 'executor' && plan.length > 1 && running && <span className="ml-0.5 text-[9px] tabular-nums text-muted-foreground">
                    {currentSubtask + 1}/{plan.length}
                  </span>}
              </div>
            </div>;
      })}
      </div>
      {!running && currentPhase !== 'idle' && currentPhase !== 'complete' && <span className="ml-auto text-[10px] text-muted-foreground">idle</span>}
    </div>;
}