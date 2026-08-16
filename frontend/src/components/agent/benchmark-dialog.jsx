// ════════════════════════════════════════════════════════════════
// FILE: components/agent/benchmark-dialog.jsx
// PURPOSE: Modal for running standard evaluations and measuring
//          agent reasoning latency and tool usage efficiency.
// EXPORTS: BenchmarkDialog
// DEPENDS ON: lucide-react, ui/dialog
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Gauge, Play, CheckCircle2, XCircle, Clock, Zap, Wrench, Trophy, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
const DIFFICULTY_COLORS = {
  easy: 'text-emerald-500 bg-emerald-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  hard: 'text-rose-500 bg-rose-500/10'
};

const BENCHMARK_TASKS = [
  {
    id: 't1',
    difficulty: 'easy',
    category: 'Math',
    task: 'What is 15% of 2400? Use the calculator.',
    expected: '360'
  },
  {
    id: 't2',
    difficulty: 'easy',
    category: 'Data Query',
    task: 'Query the database for the top 3 countries by GDP in 2023 and list them.',
    expected: 'United States'
  },
  {
    id: 't3',
    difficulty: 'medium',
    category: 'Knowledge',
    task: 'What is the capital of France? Look it up on Wikipedia.',
    expected: 'Paris'
  },
  {
    id: 't4',
    difficulty: 'medium',
    category: 'Multi-step',
    task: 'Calculate the average of 10, 20, and 30 using the calculator, then explain what an average is using Wikipedia.',
    expected: '20'
  },
  {
    id: 't5',
    difficulty: 'hard',
    category: 'Analysis',
    task: 'Which country had the highest inflation in 2023? Query the database and explain what drives high inflation.',
    expected: 'inflation'
  }
];
export function BenchmarkDialog() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!open) return;
    setTasks(BENCHMARK_TASKS);
  }, [open]);
  const runBenchmark = async () => {
    setRunning(true);
    setResults({});
    for (const task of tasks) {
      setResults(prev => ({
        ...prev,
        [task.id]: {
          taskId: task.id,
          status: 'running'
        }
      }));
      const start = Date.now();
      try {
        // Submit the task via the agent socket
        const res = await fetch('/api/agent/benchmark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task: task.task
          })
        });
        const data = await res.json();
        const durationMs = Date.now() - start;
        const matched = data.result ? data.result.toLowerCase().includes(task.expected.toLowerCase()) : false;
        setResults(prev => ({
          ...prev,
          [task.id]: {
            taskId: task.id,
            status: data.status === 'completed' ? 'completed' : 'failed',
            result: data.result?.slice(0, 200),
            durationMs,
            steps: data.steps,
            toolCalls: data.toolCalls,
            matched
          }
        }));
      } catch {
        setResults(prev => ({
          ...prev,
          [task.id]: {
            taskId: task.id,
            status: 'failed',
            durationMs: Date.now() - start
          }
        }));
      }
    }
    setRunning(false);
  };
  const completed = Object.values(results).filter(r => r.status === 'completed');
  const passed = completed.filter(r => r.matched);
  const avgDuration = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.durationMs ?? 0), 0) / completed.length) : 0;
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-border/60 bg-muted/40" title="Benchmark mode">
          <Gauge className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-[640px] gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-amber-500" />
            Benchmark Mode
          </DialogTitle>
        <DialogDescription className="sr-only">Run benchmark tasks</DialogDescription>
          <p className="text-xs text-muted-foreground">
            Run a predefined suite of {tasks.length} tasks and collect performance metrics
          </p>
        </DialogHeader>

        {/* Summary bar */}
        {Object.keys(results).length > 0 && <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-5 py-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold tabular-nums">
                {passed.length}/{completed.length}
              </span>
              <span className="text-[10px] text-muted-foreground">passed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-xs font-semibold tabular-nums">
                {avgDuration > 1000 ? `${(avgDuration / 1000).toFixed(1)}s` : `${avgDuration}ms`}
              </span>
              <span className="text-[10px] text-muted-foreground">avg</span>
            </div>
            <Button size="sm" variant="ghost" onClick={runBenchmark} disabled={running} className="ml-auto h-7 gap-1.5 text-xs">
              <RotateCcw className="h-3 w-3" />
              Re-run
            </Button>
          </div>}

        {/* Action bar */}
        {Object.keys(results).length === 0 && <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {tasks.length} tasks across{' '}
              {[...new Set(tasks.map(t => t.category))].length} categories
            </p>
            <Button size="sm" onClick={runBenchmark} disabled={running || tasks.length === 0} className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Run Benchmark
            </Button>
          </div>}

        <ScrollArea className="scroll-thin max-h-[55vh]">
          <div className="space-y-2 p-4">
            {tasks.map(task => {
            const result = results[task.id];
            const isRunning = result?.status === 'running';
            return <div key={task.id} className={cn('rounded-lg border p-3 transition-colors', isRunning ? 'border-amber-500/30 bg-amber-500/5' : result?.status === 'completed' ? result.matched ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5' : result?.status === 'failed' ? 'border-rose-500/20 bg-rose-500/5' : 'border-border/60')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('h-4 px-1 text-[9px]', DIFFICULTY_COLORS[task.difficulty])}>
                          {task.difficulty}
                        </Badge>
                        <Badge variant="outline" className="h-4 px-1 text-[9px]">
                          {task.category}
                        </Badge>
                        {isRunning && <span className="flex items-center gap-1 text-[10px] text-amber-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            running...
                          </span>}
                      </div>
                      <p className="mt-1 text-xs">{task.task}</p>
                    </div>
                    {result?.status === 'completed' && <div className="shrink-0">
                        {result.matched ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                      </div>}
                  </div>

                  {result?.status === 'completed' && <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {result.durationMs && result.durationMs > 1000 ? `${(result.durationMs / 1000).toFixed(1)}s` : `${result.durationMs}ms`}
                      </span>
                      {result.steps !== undefined && <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {result.steps} steps
                        </span>}
                      {result.toolCalls !== undefined && result.toolCalls > 0 && <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Wrench className="h-3 w-3" />
                          {result.toolCalls} tools
                        </span>}
                      <p className="basis-full text-[10px] text-muted-foreground">
                        <span className="font-medium">Expected:</span> {task.expected}
                      </p>
                      {result.result && <p className="basis-full line-clamp-2 text-[10px] text-muted-foreground">
                          <span className="font-medium">Got:</span> {result.result}
                        </p>}
                    </div>}
                </div>;
          })}
          </div>
        </ScrollArea>

        {/* Footer with pass rate */}
        {Object.keys(results).length > 0 && completed.length === tasks.length && <div className="border-t border-border/60 bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">
                Pass rate: {Math.round(passed.length / completed.length * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({passed.length}/{completed.length} tasks matched expected output)
              </span>
            </div>
          </div>}
      </DialogContent>
    </Dialog>;
}