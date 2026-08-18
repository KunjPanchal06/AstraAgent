// ════════════════════════════════════════════════════════════════
// FILE: components/agent/thought-chain.jsx
// PURPOSE: Visualizes the agent's internal reasoning process.
//          Displays a scrollable log of thoughts, actions, and
//          memory retrievals as they happen.
// EXPORTS: ThoughtChain
// DEPENDS ON: agent-store, lucide-react, framer-motion
// ════════════════════════════════════════════════════════════════

import { useAgentStore } from '@/lib/agent-store';
import { Brain, Wrench, CheckCircle2, AlertCircle, RefreshCw, Database, ListChecks, Flag, Lightbulb, Terminal, Search, Calculator, Globe, Code2, Network } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '@/hooks/use-copy';
import { MarkdownRenderer } from '@/components/agent/markdown';
import { Copy, Check } from 'lucide-react';
const TOOL_ICONS = {
  web_search: Search,
  calculator: Calculator,
  wikipedia: Globe,
  sql_query: Database,
  code_execution: Code2,
  knowledge_graph: Network
};
const PHASE_LABELS = {
  planner: {
    label: 'Planner',
    color: 'text-amber-500',
    icon: ListChecks
  },
  executor: {
    label: 'Executor',
    color: 'text-emerald-500',
    icon: Wrench
  },
  critic: {
    label: 'Critic',
    color: 'text-violet-500',
    icon: CheckCircle2
  },
  replanner: {
    label: 'Replanner',
    color: 'text-rose-500',
    icon: RefreshCw
  },
  complete: {
    label: 'Complete',
    color: 'text-sky-500',
    icon: Flag
  },
  idle: {
    label: 'Idle',
    color: 'text-slate-400',
    icon: Brain
  }
};
export function ThoughtChain() {
  const {
    thoughts,
    running,
    cycles
  } = useAgentStore();
  return <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold">Thought Chain</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 gap-1 text-[10px]">
            {thoughts.length} events
          </Badge>
          {running && <span className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              live
            </span>}
        </div>
      </div>

      <ScrollArea className="scroll-thin min-h-0 flex-1">
        <div className="space-y-1 px-4 py-4">
          {thoughts.length === 0 ? <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40">
                <Brain className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                The agent&apos;s live reasoning trace will appear here.
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Thoughts, tool calls, observations, critique &amp; replanning.
              </p>
            </div> : <div className="relative">
              {/* vertical line */}
              <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border/60" />
              {thoughts.map(t => <ThoughtItem key={t.id} thought={t} />)}
              {running && <div className="relative ml-8 flex items-center gap-2 py-2 text-[11px] text-muted-foreground">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
                  </span>
                  thinking…
                </div>}
            </div>}
        </div>
      </ScrollArea>
    </div>;
}
function ThoughtItem({
  thought
}) {
  const config = THOUGHT_CONFIG[thought.type];
  const Icon = config.icon;
  return <div className="animate-fade-in relative flex gap-3 pb-3">
      <div className={cn('relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold', config.color)}>{config.label}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(thought.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <ThoughtContent thought={thought} />
      </div>
    </div>;
}
function ThoughtContent({
  thought
}) {
  const d = thought.data;
  switch (thought.type) {
    case 'phase':
      if (d.phase === 'start') {
        return <div className="mt-1 rounded-lg border border-border/60 bg-muted/30 p-2">
            <p className="text-[11px] text-muted-foreground">Task received</p>
            <p className="mt-0.5 text-xs font-medium">{String(d.taskInput ?? '')}</p>
          </div>;
      }
      const ph = PHASE_LABELS[String(d.phase)] ?? {
        label: String(d.phase),
        color: '',
        icon: Brain
      };
      const PhIcon = ph.icon;
      return <p className="mt-0.5 text-[11px] text-muted-foreground">
          Entering <span className={cn('font-semibold', ph.color)}>{ph.label}</span> phase
        </p>;
    case 'plan':
      return <div className="mt-1 space-y-1">
          <p className="text-[11px] text-muted-foreground">Decomposed plan:</p>
          <ol className="space-y-0.5">
            {d.plan?.map((p, i) => <li key={i} className="flex gap-1.5 text-xs">
                <span className="font-mono text-[10px] text-muted-foreground">{i + 1}.</span>
                <span>{p}</span>
              </li>)}
          </ol>
        </div>;
    case 'subtask':
      return <p className="mt-0.5 text-[11px]">
          <span className="font-mono text-muted-foreground">[{Number(d.index) + 1}]</span>{' '}
          {String(d.subtask ?? '')}
        </p>;
    case 'react':
      return <ReactCycleView cycle={d.cycle} stepIndex={d.stepIndex} />;
    case 'tool':
      if (d.phase === 'start') {
        const ToolIcon = TOOL_ICONS[String(d.tool)] ?? Wrench;
        return <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
            <div className="flex items-center gap-1.5">
              <ToolIcon className="h-3 w-3 text-emerald-500" />
              <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {String(d.tool)}
              </span>
            </div>
            <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-1.5 font-mono text-[10px] leading-relaxed">
              {JSON.stringify(d.input, null, 2)}
            </pre>
          </div>;
      }
      return <ToolResultView result={d.result} />;
    case 'critique':
      return <div className={cn('mt-1 rounded-lg border p-2', d.passed ? 'border-violet-500/20 bg-violet-500/5' : 'border-rose-500/20 bg-rose-500/5')}>
          <div className="flex items-center gap-1.5">
            {d.passed ? <CheckCircle2 className="h-3 w-3 text-violet-500" /> : <AlertCircle className="h-3 w-3 text-rose-500" />}
            <span className={cn('text-[11px] font-semibold', d.passed ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400')}>
              {d.passed ? 'Accepted' : 'Rejected'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{String(d.critique ?? '')}</p>
        </div>;
    case 'replan':
      return <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
          <p className="text-[11px] text-rose-600 dark:text-rose-400">Replanning: {String(d.reason ?? '')}</p>
          <ol className="mt-1 space-y-0.5">
            {d.newPlan?.map((p, i) => <li key={i} className="flex gap-1.5 text-[11px]">
                <span className="font-mono text-[10px] text-muted-foreground">{i + 1}.</span>
                <span>{p}</span>
              </li>)}
          </ol>
        </div>;
    case 'memory':
      if (d.phase === 'store') {
        return <p className="mt-0.5 text-[11px]">
            <Database className="mr-1 inline h-3 w-3 text-cyan-500" />
            Stored {String(d.memoryType)} memory:{' '}
            <span className="text-muted-foreground">{String(d.summary ?? '')}</span>
          </p>;
      }
      return <div className="mt-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
          <p className="text-[11px] text-cyan-600 dark:text-cyan-400">
            Retrieved {String(d.memoryType)} memory for: {String(d.query ?? '')}
          </p>
          {d.matches?.length ? <ul className="mt-1 space-y-0.5">
              {d.matches.slice(0, 3).map((m, i) => <li key={i} className="text-[10px] text-muted-foreground">
                  • {JSON.stringify(m)}
                </li>)}
            </ul> : <p className="mt-0.5 text-[10px] text-muted-foreground/70">No matches</p>}
        </div>;
    case 'complete':
      return <div className="mt-1 rounded-lg border border-sky-500/20 bg-sky-500/5 p-2">
          <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Final Answer</p>
          <p className="mt-1 whitespace-pre-wrap text-xs">{String(d.answer ?? '')}</p>
        </div>;
    case 'error':
      return <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Error</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{String(d.message ?? '')}</p>
        </div>;
    case 'log':
      return <p className="mt-0.5 text-[11px] text-muted-foreground">{String(d.message ?? '')}</p>;
    default:
      return null;
  }
}
function ReactCycleView({
  cycle,
  stepIndex
}) {
  if (!cycle) return null;
  return <div className="mt-1 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3 w-3 text-amber-500" />
        <span className="font-mono text-[10px] text-muted-foreground">step {stepIndex + 1}</span>
      </div>
      <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Thought
        </p>
        <p className="mt-0.5 text-xs leading-relaxed">{cycle.thought}</p>
      </div>
      {cycle.action && <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Action
            </span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              {cycle.action}
            </span>
          </div>
          {cycle.actionInput && <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-1.5 font-mono text-[10px] leading-relaxed">
              {JSON.stringify(cycle.actionInput, null, 2)}
            </pre>}
        </div>}
      {cycle.observation && <div className="rounded-lg border border-slate-500/15 bg-slate-500/[0.03] p-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Observation
          </span>
          <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap rounded font-mono text-[10px] leading-relaxed text-muted-foreground">
            {cycle.observation}
          </pre>
        </div>}
      {cycle.isFinal && cycle.finalAnswer && <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Final Answer
          </span>
          <div className="mt-0.5 text-xs">
            <MarkdownRenderer content={cycle.finalAnswer} />
          </div>
        </div>}
    </div>;
}
function ToolResultView({
  result
}) {
  const {
    copied,
    copy
  } = useCopyToClipboard();
  if (!result) return null;
  const Icon = TOOL_ICONS[result.tool] ?? Wrench;
  const resultText = result.error ?? JSON.stringify(result.output, null, 2);
  return <div className={cn('mt-1 rounded-lg border p-2', result.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-emerald-500" />
          <span className="font-mono text-[11px] font-semibold">{result.tool}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {result.success ? <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" /> ok
            </Badge> : <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[9px] text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-2.5 w-2.5" /> err
            </Badge>}
          <span className="text-[10px] tabular-nums text-muted-foreground">{result.durationMs}ms</span>
          <button onClick={() => copy(resultText)} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Copy result">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {result.error ? <p className="mt-1 font-mono text-[10px] text-rose-600 dark:text-rose-400">{result.error}</p> : <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/60 p-1.5 font-mono text-[10px] leading-relaxed">
          {JSON.stringify(result.output, null, 2)}
        </pre>}
    </div>;
}
const THOUGHT_CONFIG = {
  phase: {
    label: 'Phase',
    icon: Flag,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10'
  },
  plan: {
    label: 'Plan',
    icon: ListChecks,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  subtask: {
    label: 'Subtask',
    icon: ListChecks,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  react: {
    label: 'ReAct',
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  tool: {
    label: 'Tool',
    icon: Wrench,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  critique: {
    label: 'Critique',
    icon: CheckCircle2,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  },
  replan: {
    label: 'Replan',
    icon: RefreshCw,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
  memory: {
    label: 'Memory',
    icon: Database,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10'
  },
  complete: {
    label: 'Complete',
    icon: Flag,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10'
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
  log: {
    label: 'Log',
    icon: Terminal,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10'
  }
};