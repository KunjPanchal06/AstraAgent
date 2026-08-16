// ════════════════════════════════════════════════════════════════
// FILE: components/agent/chat-panel.jsx
// PURPOSE: Renders the chat interface for interacting with the agent.
//          Displays the conversation history and a chat input box.
// EXPORTS: ChatPanel
// DEPENDS ON: agent-store, lucide-react, ui components
// ════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, RotateCcw, ChevronDown, Copy, Check } from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCopyToClipboard } from '@/hooks/use-copy';
import { MarkdownRenderer } from '@/components/agent/markdown';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
const SUGGESTED_TASKS = [{
  label: 'Compare top economies',
  task: 'Compare the GDP of the top 5 economies in 2023 from our database and calculate what percentage of the global total they represent. Search the web for the approximate 2023 global GDP.'
}, {
  label: 'Research a topic',
  task: 'Research the current state of quantum computing in 2024: find the latest breakthroughs via web search, get a Wikipedia summary of quantum supremacy, and summarize the key findings.'
}, {
  label: 'Data analysis',
  task: 'Analyze inflation trends: query the economic_indicators database for countries with inflation above 5% in 2023, calculate the average inflation for those countries using the calculator, and explain what drives high inflation.'
}, {
  label: 'Compute & explain',
  task: 'What is the compound annual growth rate of India\'s GDP from 2020 (2670) to 2023 (3730)? Use the calculator and explain what CAGR means using Wikipedia.'
}];
export function ChatPanel() {
  const {
    messages,
    running,
    runTask,
    abortTask,
    reset,
    finalAnswer,
    currentTaskId
  } = useAgentStore();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length, finalAnswer]);
  const handleSubmit = () => {
    const task = input.trim();
    if (!task || running) return;
    setShowSuggestions(false);
    runTask(task);
    setInput('');
  };
  const handleKeyDown = e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  return <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold">Agent Console</h2>
        </div>
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={() => {
        reset();
        setShowSuggestions(true);
      }} className="h-7 gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            New
          </Button>}
      </div>

      <div ref={scrollRef} className="scroll-thin scroll-contain min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-emerald-500/20">
              <Sparkles className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Give the agent a task</h3>
              <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                The agent will plan, use tools, self-correct, and report back — all
                visible in the thought chain →
              </p>
            </div>
            {showSuggestions && <div className="mt-2 w-full max-w-md space-y-2">
                <button onClick={() => setShowSuggestions(v => !v)} className="flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  Try an example
                  <ChevronDown className={cn('h-3 w-3 transition-transform', showSuggestions ? '' : 'rotate-180')} />
                </button>
                <div className="grid gap-2">
                  {SUGGESTED_TASKS.map(s => <button key={s.label} onClick={() => {
              setInput(s.task);
            }} className="group rounded-lg border border-border/60 bg-muted/30 p-3 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{s.label}</span>
                        <Send className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {s.task}
                      </p>
                    </button>)}
                </div>
              </div>}
          </div> : <div className="space-y-4">
            {messages.map(m => <MessageBubble key={m.id} message={m} />)}
            {running && <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
                </span>
                Agent working…
              </div>}
          </div>}
      </div>

      <div className="shrink-0 border-t border-border/60 p-3">
        <div className="relative">
          <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe a multi-step task for the agent…" disabled={running} className="min-h-[60px] max-h-[160px] resize-none pr-24 text-sm" />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            {running ? <Button size="sm" variant="destructive" onClick={abortTask} className="h-8 gap-1.5">
                <Square className="h-3 w-3" />
                Stop
              </Button> : <Button size="sm" onClick={handleSubmit} disabled={!input.trim()} className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Send className="h-3 w-3" />
                Run
              </Button>}
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground">
            ⌘/Ctrl + Enter to run
          </span>
          {currentTaskId && <span className="font-mono text-[10px] text-muted-foreground">
              {currentTaskId.slice(0, 12)}…
            </span>}
        </div>
      </div>
    </div>;
}
function MessageBubble({
  message
}) {
  const isUser = message.role === 'user';
  const {
    copied,
    copy
  } = useCopyToClipboard();
  return <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-1.5 px-1">
        <Badge variant="outline" className={cn('h-4 gap-1 px-1.5 text-[10px] font-medium', isUser ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
          {isUser ? 'You' : 'Agent'}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
        {!isUser && <button onClick={() => copy(message.content)} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100" title="Copy message">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>}
      </div>
      <div className={cn('group max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', isUser ? 'rounded-br-md bg-sky-500/10 text-foreground ring-1 ring-sky-500/20' : 'rounded-bl-md bg-muted/60 text-foreground ring-1 ring-border/60')}>
        {isUser ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : <MarkdownRenderer content={message.content} />}
      </div>
    </div>;
}