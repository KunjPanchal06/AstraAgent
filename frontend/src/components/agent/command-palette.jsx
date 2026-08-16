// ════════════════════════════════════════════════════════════════
// FILE: components/agent/command-palette.jsx
// PURPOSE: Global command palette (⌘⇧K) for quick navigation,
//          tab switching, dark mode toggle, and agent actions.
//          Built on top of the shadcn Command + Dialog primitives.
// EXPORTS: CommandPalette
// DEPENDS ON: react-router-dom, agent-store, ui/command, ui/dialog
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Wrench, Database, History, Settings2, Gauge, Moon, Sun, Play, GitCompare, Download, Trash2, RotateCcw, Sparkles, Send, CornerDownLeft } from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';
export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onOpenSettings,
  onOpenBenchmark,
  onToggleDark,
  onFocusChat
}) {
  const navigate = useNavigate();
  const {
    runTask,
    abortTask,
    running
  } = useAgentStore();
  const [query, setQuery] = useState('');
  const commands = useMemo(() => [
  // Navigation
  {
    id: 'nav-console',
    label: 'Go to Agent Console',
    description: 'Chat with the agent',
    icon: MessageSquare,
    shortcut: '⌘1',
    group: 'Navigation',
    action: () => {
      onNavigate('console');
      onOpenChange(false);
    }
  }, {
    id: 'nav-tools',
    label: 'Go to Tool Bench',
    description: 'Test individual tools',
    icon: Wrench,
    shortcut: '⌘2',
    group: 'Navigation',
    action: () => {
      onNavigate('tools');
      onOpenChange(false);
    }
  }, {
    id: 'nav-memory',
    label: 'Go to Memory Bank',
    description: 'Episodic + semantic memory',
    icon: Database,
    shortcut: '⌘3',
    group: 'Navigation',
    action: () => {
      onNavigate('memory');
      onOpenChange(false);
    }
  }, {
    id: 'nav-trajectory',
    label: 'Go to Trajectories',
    description: 'Past task history',
    icon: History,
    shortcut: '⌘4',
    group: 'Navigation',
    action: () => {
      onNavigate('trajectory');
      onOpenChange(false);
    }
  },
  // Actions
  {
    id: 'action-focus-chat',
    label: 'Focus chat input',
    description: 'Start typing a task',
    icon: Send,
    shortcut: '⌘K',
    group: 'Actions',
    action: () => {
      onNavigate('console');
      onFocusChat();
      onOpenChange(false);
    }
  }, {
    id: 'action-settings',
    label: 'Open agent settings',
    description: 'Configure ReAct loop, critic, memory',
    icon: Settings2,
    group: 'Actions',
    action: () => {
      onOpenSettings();
      onOpenChange(false);
    }
  }, {
    id: 'action-benchmark',
    label: 'Run benchmark suite',
    description: '5 predefined tasks with metrics',
    icon: Gauge,
    group: 'Actions',
    action: () => {
      onOpenBenchmark();
      onOpenChange(false);
    }
  }, {
    id: 'action-toggle-dark',
    label: 'Toggle dark mode',
    description: 'Switch light/dark theme',
    icon: Sun,
    group: 'Actions',
    action: () => {
      onToggleDark();
      onOpenChange(false);
    }
  },
  // Quick tasks
  {
    id: 'task-calc',
    label: 'Quick task: Calculate 15% of 2400',
    description: 'Runs immediately',
    icon: Sparkles,
    group: 'Quick Tasks',
    action: () => {
      onNavigate('console');
      runTask('What is 15% of 2400? Use the calculator.');
      onOpenChange(false);
    }
  }, {
    id: 'task-sql',
    label: 'Quick task: Top 5 economies by GDP',
    description: 'Queries the economic database',
    icon: Sparkles,
    group: 'Quick Tasks',
    action: () => {
      onNavigate('console');
      runTask('Query the database for the top 5 countries by GDP in 2023 and list them with their GDP values.');
      onOpenChange(false);
    }
  }, {
    id: 'task-wiki',
    label: 'Quick task: What is quantum computing?',
    description: 'Uses Wikipedia + web search',
    icon: Sparkles,
    group: 'Quick Tasks',
    action: () => {
      onNavigate('console');
      runTask('What is quantum computing? Look it up on Wikipedia and summarize the key concepts.');
      onOpenChange(false);
    }
  }], [onNavigate, onOpenChange, onOpenSettings, onOpenBenchmark, onToggleDark, onFocusChat, runTask]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [query, commands]);

  // Group filtered commands
  const grouped = useMemo(() => {
    const groups = {};
    for (const cmd of filtered) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [filtered]);

  // Reset query when dialog closes via the onOpenChange handler
  const handleOpenChange = next => {
    if (!next) setQuery('');
    onOpenChange(next);
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="overflow-hidden p-0 shadow-2xl sm:max-w-[560px]">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command className="rounded-xl" shouldFilter={false}>
          <CommandInput placeholder="Type a command or search..." value={query} onValueChange={setQuery} autoFocus />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(grouped).map(([group, cmds]) => <div key={group}>
                <CommandGroup heading={group}>
                  {cmds.map(cmd => {
                const Icon = cmd.icon;
                return <CommandItem key={cmd.id} value={cmd.id} onSelect={() => cmd.action()} className="gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{cmd.label}</p>
                          {cmd.description && <p className="text-[10px] text-muted-foreground">
                              {cmd.description}
                            </p>}
                        </div>
                        {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                      </CommandItem>;
              })}
                </CommandGroup>
                <CommandSeparator />
              </div>)}
          </CommandList>
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              {filtered.length} commands
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <kbd className="rounded bg-muted-foreground/15 px-1 font-mono">↑↓</kbd>
              navigate
              <kbd className="ml-1 rounded bg-muted-foreground/15 px-1 font-mono">
                <CornerDownLeft className="inline h-2.5 w-2.5" />
              </kbd>
              select
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>;
}