// ════════════════════════════════════════════════════════════════
// FILE: components/agent/replay-dialog.jsx
// PURPOSE: Modal for stepping backward and forward through a past
//          agent trajectory to review reasoning and tool usage.
// EXPORTS: ReplayDialog
// DEPENDS ON: lucide-react, ui/dialog
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, ChevronRight, X, Brain, Wrench, Eye, CheckCircle2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarkdownRenderer } from '@/components/agent/markdown';
import { cn } from '@/lib/utils';
const PHASE_ICONS = {
  plan: Flag,
  thought: Brain,
  act: Wrench,
  observe: Eye,
  critique: CheckCircle2,
  replan: RotateCcw,
  final: Flag
};
const PHASE_COLORS = {
  plan: 'text-amber-500 bg-amber-500/10',
  thought: 'text-amber-500 bg-amber-500/10',
  act: 'text-emerald-500 bg-emerald-500/10',
  observe: 'text-slate-400 bg-slate-500/10',
  critique: 'text-violet-500 bg-violet-500/10',
  replan: 'text-rose-500 bg-rose-500/10',
  final: 'text-sky-500 bg-sky-500/10'
};
export function ReplayDialog({
  open,
  onOpenChange,
  taskId
}) {
  const [steps, setSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const intervalRef = useRef(null);

  // Load trajectory when dialog opens
  useEffect(() => {
    if (!open || !taskId) return;
    fetch(`/api/agent/trajectories/${taskId}`).then(r => r.json()).then(data => {
      setSteps(data.trajectory ?? []);
      setCurrentIndex(0);
      setPlaying(false);
    }).catch(() => {});
  }, [open, taskId]);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const delay = 2000 / speed;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, steps.length]);
  const handlePlayPause = useCallback(() => {
    if (currentIndex >= steps.length - 1) {
      setCurrentIndex(0);
    }
    setPlaying(p => !p);
  }, [currentIndex, steps.length]);
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setPlaying(false);
  }, []);
  const handleStep = useCallback(dir => {
    setPlaying(false);
    setCurrentIndex(prev => Math.max(0, Math.min(steps.length - 1, prev + dir)));
  }, [steps.length]);

  // Keyboard shortcuts: Space=play/pause, Left/Right=step, R=reset, Esc=close
  useEffect(() => {
    if (!open || steps.length === 0) return;
    const handler = e => {
      // Don't interfere if user is typing in an input/textarea
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleStep(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStep(1);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, steps.length, handlePlayPause, handleStep, handleReset]);
  const currentStep = steps[currentIndex];
  const progress = steps.length > 0 ? (currentIndex + 1) / steps.length * 100 : 0;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-[700px] gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4 text-emerald-500" />
            Trajectory Replay
          </DialogTitle>
        <DialogDescription className="sr-only">Step through the trajectory</DialogDescription>
          <p className="text-xs text-muted-foreground">
            Step through the agent&apos;s reasoning, or play it back at adjustable speed
          </p>
        </DialogHeader>

        {steps.length === 0 ? <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
            Loading trajectory...
          </div> : <>
            {/* Progress bar */}
            <div className="border-b border-border/60 bg-muted/20 px-5 py-2">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="tabular-nums">
                  Step {currentIndex + 1} / {steps.length}
                </span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{
              width: `${progress}%`
            }} />
              </div>
            </div>

            {/* Current step display */}
            <div className="scroll-thin max-h-[50vh] overflow-y-auto p-5">
              {currentStep && <StepDisplay step={currentStep} />}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 w-8 p-0" title="Reset to start">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleStep(-1)} disabled={currentIndex === 0} className="h-8 w-8 p-0" title="Previous step">
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={handlePlayPause} className="h-8 gap-1.5 px-3">
                  {playing ? <>
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </> : <>
                      <Play className="h-3.5 w-3.5" />
                      Play
                    </>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleStep(1)} disabled={currentIndex >= steps.length - 1} className="h-8 w-8 p-0" title="Next step">
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Speed control */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Speed</span>
                {[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-colors', speed === s ? 'bg-emerald-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted')}>
                    {s}x
                  </button>)}
                <div className="ml-3 hidden items-center gap-2 text-[9px] text-muted-foreground/70 lg:flex">
                  <span className="flex items-center gap-0.5">
                    <kbd className="rounded bg-muted-foreground/15 px-1 font-mono">Space</kbd>
                    play
                  </span>
                  <span className="flex items-center gap-0.5">
                    <kbd className="rounded bg-muted-foreground/15 px-1 font-mono">←</kbd>
                    <kbd className="rounded bg-muted-foreground/15 px-1 font-mono">→</kbd>
                    step
                  </span>
                  <span className="flex items-center gap-0.5">
                    <kbd className="rounded bg-muted-foreground/15 px-1 font-mono">R</kbd>
                    reset
                  </span>
                </div>
              </div>
            </div>

            {/* Mini timeline */}
            <div className="scroll-thin flex gap-0.5 overflow-x-auto border-t border-border/60 px-5 py-2">
              {steps.map((step, i) => {
            const Icon = PHASE_ICONS[step.phase] ?? Brain;
            const isCurrent = i === currentIndex;
            const isPassed = i < currentIndex;
            return <button key={step.id} onClick={() => {
              setPlaying(false);
              setCurrentIndex(i);
            }} className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded transition-all', isCurrent ? PHASE_COLORS[step.phase] + ' ring-2 ring-emerald-500/40' : isPassed ? 'bg-muted/60' : 'bg-muted/30 hover:bg-muted/50')} title={`Step ${i + 1}: ${step.phase}`}>
                    <Icon className={cn('h-3 w-3', isCurrent ? '' : isPassed ? 'text-muted-foreground' : 'text-muted-foreground/50')} />
                  </button>;
          })}
            </div>
          </>}
      </DialogContent>
    </Dialog>;
}
function StepDisplay({
  step
}) {
  const Icon = PHASE_ICONS[step.phase] ?? Brain;
  const colors = PHASE_COLORS[step.phase] ?? 'text-slate-400 bg-slate-500/10';
  return <div className="animate-fade-in space-y-3">
      {/* Step header */}
      <div className="flex items-center gap-2">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', colors)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold capitalize">{step.phase}</span>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              #{step.stepIndex}
            </Badge>
            {step.status === 'error' && <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-rose-500">
                error
              </Badge>}
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {step.durationMs}ms · {new Date(step.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Thought */}
      {step.thought && <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Thought
          </p>
          <p className="mt-1 text-sm leading-relaxed">{step.thought}</p>
        </div>}

      {/* Action */}
      {step.action && <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-3">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Action
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {step.action}
            </span>
          </div>
          {step.actionInput && <pre className="scroll-thin mt-1.5 overflow-x-auto rounded bg-muted/60 p-2 font-mono text-[11px] leading-relaxed">
              {JSON.stringify(step.actionInput, null, 2)}
            </pre>}
        </div>}

      {/* Observation */}
      {step.observation && <div className="rounded-lg border border-slate-500/15 bg-slate-500/[0.03] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Observation
          </span>
          <pre className="scroll-thin mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded font-mono text-[11px] leading-relaxed text-muted-foreground">
            {step.observation}
          </pre>
        </div>}
    </div>;
}