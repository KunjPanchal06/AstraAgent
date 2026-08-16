// ════════════════════════════════════════════════════════════════
// FILE: components/agent/tools-panel.jsx
// PURPOSE: Displays the agent's available tools and logs the
//          arguments and results of tool invocations in real-time.
// EXPORTS: ToolsPanel
// DEPENDS ON: agent-store, lucide-react, framer-motion
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Search, Calculator, Globe, Database, Code2, Network, Play, Loader2, CheckCircle2, AlertCircle, Wrench, Copy, Check } from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
const TOOLS = [{
  name: 'web_search',
  icon: Search,
  color: 'text-sky-500',
  bg: 'bg-sky-500/10',
  label: 'Web Search',
  fields: [{
    name: 'query',
    required: true,
    placeholder: 'latest GDP growth India 2024'
  }, {
    name: 'num',
    required: false,
    placeholder: '5'
  }],
  defaultInput: {
    query: 'latest AI breakthroughs 2024',
    num: 5
  }
}, {
  name: 'calculator',
  icon: Calculator,
  color: 'text-emerald-500',
  bg: 'bg-emerald-500/10',
  label: 'Calculator',
  fields: [{
    name: 'expression',
    required: true,
    placeholder: '(1250 * 0.18) + 430 - (320 / 4)',
    multiline: false
  }],
  defaultInput: {
    expression: '(17790 - 14720) / 14720 * 100'
  }
}, {
  name: 'wikipedia',
  icon: Globe,
  color: 'text-amber-500',
  bg: 'bg-amber-500/10',
  label: 'Wikipedia',
  fields: [{
    name: 'query',
    required: true,
    placeholder: 'Gross domestic product'
  }, {
    name: 'sentences',
    required: false,
    placeholder: '3'
  }],
  defaultInput: {
    query: 'Gross domestic product',
    sentences: 3
  }
}, {
  name: 'sql_query',
  icon: Database,
  color: 'text-violet-500',
  bg: 'bg-violet-500/10',
  label: 'SQL Query',
  fields: [{
    name: 'query',
    required: true,
    placeholder: 'SELECT country, gdp_usd_bn FROM economic_indicators WHERE year=2023 ORDER BY gdp_usd_bn DESC LIMIT 5',
    multiline: true
  }],
  defaultInput: {
    query: 'SELECT country, gdp_usd_bn, inflation_pct FROM economic_indicators WHERE year=2023 ORDER BY gdp_usd_bn DESC LIMIT 8'
  }
}, {
  name: 'code_execution',
  icon: Code2,
  color: 'text-rose-500',
  bg: 'bg-rose-500/10',
  label: 'Code Execution',
  fields: [{
    name: 'code',
    required: true,
    placeholder: 'const data = [10, 20, 30, 40, 50];\nconst mean = data.reduce((a,b)=>a+b,0)/data.length;\nprint("mean =", mean);',
    multiline: true
  }],
  defaultInput: {
    code: 'const gdp = [27360, 17790, 3730, 4450, 4210];\nconst total = gdp.reduce((a,b)=>a+b,0);\nconst mean = total / gdp.length;\nprint("Total GDP (bn):", total);\nprint("Mean GDP (bn):", mean);\nprint("US share (%):", (27360/total*100).toFixed(1));'
  }
}, {
  name: 'knowledge_graph',
  icon: Network,
  color: 'text-cyan-500',
  bg: 'bg-cyan-500/10',
  label: 'Knowledge Graph',
  fields: [{
    name: 'operation',
    required: true,
    placeholder: 'query'
  }, {
    name: 'subject',
    required: false,
    placeholder: 'India'
  }, {
    name: 'relation',
    required: false,
    placeholder: 'capital'
  }, {
    name: 'object',
    required: false,
    placeholder: 'New Delhi'
  }],
  defaultInput: {
    operation: 'list'
  }
}];
export function ToolsPanel() {
  const [activeTool, setActiveTool] = useState('web_search');
  const [inputs, setInputs] = useState(() => Object.fromEntries(TOOLS.map(t => [t.name, {
    ...t.defaultInput
  }])));
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);
  const {
    testTool,
    connected
  } = useAgentStore();
  const {
    copied,
    copy
  } = useCopyToClipboard();
  const [schema, setSchema] = useState({});
  useEffect(() => {
    fetch('/api/agent/tools').then(r => r.json()).then(data => {
      const map = {};
      for (const t of data.tools ?? []) {
        map[t.name] = t;
      }
      setSchema(map);
    }).catch(() => {});
  }, []);
  const handleRun = async tool => {
    setLoading(tool);
    const result = await testTool(tool, inputs[tool]);
    setResults(r => ({
      ...r,
      [tool]: result
    }));
    setLoading(null);
  };
  const active = TOOLS.find(t => t.name === activeTool);
  const ActiveIcon = active.icon;
  const result = results[activeTool];
  const schemaInfo = schema[activeTool];
  return <div className="flex h-full min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[280px_1fr]">
      {/* Tool list */}
      <div className="flex max-h-[32%] min-h-0 flex-col gap-2 lg:max-h-none">
        <div className="flex shrink-0 items-center gap-2 px-1">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Tool Library</h3>
          <Badge variant="outline" className="ml-auto h-5 text-[10px]">
            {TOOLS.length} tools
          </Badge>
        </div>
        <ScrollArea className="scroll-thin min-h-0 flex-1">
          <div className="grid gap-1.5 pr-1">
          {TOOLS.map(t => {
            const Icon = t.icon;
            const isActive = t.name === activeTool;
            return <button key={t.name} onClick={() => setActiveTool(t.name)} className={cn('group flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all', isActive ? 'border-border bg-muted/60 shadow-sm' : 'border-transparent hover:border-border/60 hover:bg-muted/30')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', t.bg)}>
                  <Icon className={cn('h-4 w-4', t.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{t.name}</p>
                </div>
                {results[t.name] && <div className="flex h-5 w-5 items-center justify-center">
                    {results[t.name].success ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-rose-500" />}
                  </div>}
              </button>;
          })}
          </div>
        </ScrollArea>
      </div>

      {/* Tool detail / runner */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border/60 bg-card/40 lg:flex-1">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 px-4 py-3">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', active.bg)}>
            <ActiveIcon className={cn('h-4 w-4', active.color)} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{active.label}</h3>
            <p className="truncate font-mono text-[10px] text-muted-foreground">{active.name}</p>
          </div>
          <Button size="sm" onClick={() => handleRun(activeTool)} disabled={!connected || loading === activeTool} className="gap-1.5">
            {loading === activeTool ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run
          </Button>
        </div>

        <ScrollArea className="scroll-thin min-h-0 flex-1">
          <div className="space-y-4 p-4">
            {schemaInfo && <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 text-xs leading-relaxed">{schemaInfo.description}</p>
              </div>}

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Input
              </p>
              {active.fields.map(f => <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={`${activeTool}-${f.name}`} className="flex items-center gap-2 text-xs">
                    <span className="font-mono">{f.name}</span>
                    {f.required ? <Badge variant="outline" className="h-4 px-1 text-[9px] text-rose-500">
                        required
                      </Badge> : <Badge variant="outline" className="h-4 px-1 text-[9px] text-muted-foreground">
                        optional
                      </Badge>}
                  </Label>
                  {f.multiline ? <Textarea id={`${activeTool}-${f.name}`} value={String(inputs[activeTool][f.name] ?? '')} onChange={e => setInputs(s => ({
                ...s,
                [activeTool]: {
                  ...s[activeTool],
                  [f.name]: e.target.value
                }
              }))} placeholder={f.placeholder} className="min-h-[80px] resize-y font-mono text-xs" /> : <Input id={`${activeTool}-${f.name}`} value={String(inputs[activeTool][f.name] ?? '')} onChange={e => {
                const val = e.target.value;
                const numField = f.name === 'num' || f.name === 'sentences';
                setInputs(s => ({
                  ...s,
                  [activeTool]: {
                    ...s[activeTool],
                    [f.name]: numField && val ? Number(val) : val
                  }
                }));
              }} placeholder={f.placeholder} className="font-mono text-xs" />}
                </div>)}
            </div>

            {result && <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Result
                  </p>
                  <div className="flex items-center gap-2">
                    {result.success ? <Badge variant="outline" className="h-5 gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> success
                      </Badge> : <Badge variant="outline" className="h-5 gap-1 text-[10px] text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-3 w-3" /> error
                      </Badge>}
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {result.durationMs}ms
                    </span>
                    <button onClick={() => copy(result.error ?? JSON.stringify(result.output, null, 2))} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Copy result">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                {result.error ? <pre className="scroll-thin overflow-auto rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 font-mono text-[11px] text-rose-600 dark:text-rose-400">
                    {result.error}
                  </pre> : <pre className="scroll-thin max-h-[400px] overflow-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(result.output, null, 2)}
                  </pre>}
              </div>}

            {!result && !loading && <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 py-10 text-center">
                <Play className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  Click <span className="font-semibold">Run</span> to test this tool
                </p>
              </div>}
          </div>
        </ScrollArea>
      </div>
    </div>;
}