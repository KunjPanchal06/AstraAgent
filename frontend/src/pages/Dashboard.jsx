// ════════════════════════════════════════════════════════════════
// FILE: pages/Dashboard.jsx
// PURPOSE: Main authenticated workspace. Orchestrates all agent
//          panels via a tabbed layout:
//            Console  — Chat + Thought Chain (resizable split)
//            Tools    — Tool Bench panel
//            Memory   — Memory Bank panel
//            Trajectories — Past task trajectory viewer
//          Also wires keyboard shortcuts (⌘1–4, ⌘K, ⌘⇧K)
//          and renders the global CommandPalette overlay.
// EXPORTS: Dashboard (default)
// DEPENDS ON: agent-store, all agent/* components, ui/tabs,
//             ui/resizable, lucide-react
// ════════════════════════════════════════════════════════════════
import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { AgentHeader } from '@/components/agent/header'
import { StatsBar } from '@/components/agent/stats-bar'
import { PhaseProgress } from '@/components/agent/phase-progress'
import { ChatPanel } from '@/components/agent/chat-panel'
import { ThoughtChain } from '@/components/agent/thought-chain'
import { ToolsPanel } from '@/components/agent/tools-panel'
import { MemoryPanel } from '@/components/agent/memory-panel'
import { TrajectoryDashboard } from '@/components/agent/trajectory-dashboard'
import { CommandPalette } from '@/components/agent/command-palette'
import { useAgentStore } from '@/lib/agent-store'
import { MessageSquare, Wrench, Database, History, Cpu, Code } from 'lucide-react'

export default function Dashboard() {
  const { connect, disconnect, userId, runTask } = useAgentStore()
  const [tab, setTab] = useState('console')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [darkOverride, setDarkOverride] = useState(null)

  // Mocked session ID for now until Phase 4 (SQLite Auth)
  const mockUserId = "user_12345"

  useEffect(() => {
    connect(mockUserId)
    return () => disconnect()
  }, [connect, disconnect, mockUserId])

  // Keyboard shortcuts
  const focusChatInput = useCallback(() => {
    const ta = document.querySelector('textarea[placeholder*="multi-step"]')
    ta?.focus()
    ta?.select()
  }, [])

  /**
   * Global keyboard shortcuts handler.
   * - Cmd+Shift+K: Toggle command palette
   * - Cmd+K: Focus chat input
   * - Cmd+1/2/3/4: Switch tabs
   */
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      // Cmd+Shift+K → command palette
      if (e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }
      // Cmd+K → focus chat
      if (!e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (tab !== 'console') setTab('console')
        setTimeout(focusChatInput, 50)
      } else if (e.key === '1') {
        e.preventDefault()
        setTab('console')
      } else if (e.key === '2') {
        e.preventDefault()
        setTab('tools')
      } else if (e.key === '3') {
        e.preventDefault()
        setTab('memory')
      } else if (e.key === '4') {
        e.preventDefault()
        setTab('trajectory')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, focusChatInput])

  /** Programmatically clicks the hidden settings trigger button. */
  const openSettings = useCallback(() => {
    const btn = document.querySelector('button[title="Agent settings"]')
    btn?.click()
  }, [])

  /** Programmatically clicks the hidden benchmark trigger button. */
  const openBenchmark = useCallback(() => {
    const btn = document.querySelector('button[title="Benchmark mode"]')
    btn?.click()
  }, [])

  /** Toggles the 'dark' class on the HTML document element for manual theming. */
  const toggleDark = useCallback(() => {
    setDarkOverride((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  return (
    <div className="app-gradient flex h-dvh flex-col overflow-hidden bg-background">
      <AgentHeader />
      <StatsBar />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 flex-col px-3 py-3 sm:px-4 sm:py-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v)} className="flex flex-1 min-h-0 flex-col gap-3">
          <TabsList className="flex h-10 w-full justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="console" className="gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Agent</span> Console
              <kbd className="ml-1 hidden rounded bg-muted-foreground/15 px-1 text-[9px] font-mono sm:inline">⌘1</kbd>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-1.5 text-xs sm:text-sm">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Tool</span> Bench
              <kbd className="ml-1 hidden rounded bg-muted-foreground/15 px-1 text-[9px] font-mono sm:inline">⌘2</kbd>
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5 text-xs sm:text-sm">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Memory</span> Bank
              <kbd className="ml-1 hidden rounded bg-muted-foreground/15 px-1 text-[9px] font-mono sm:inline">⌘3</kbd>
            </TabsTrigger>
            <TabsTrigger value="trajectory" className="gap-1.5 text-xs sm:text-sm">
              <History className="h-4 w-4" />
              Trajectories
              <kbd className="ml-1 hidden rounded bg-muted-foreground/15 px-1 text-[9px] font-mono sm:inline">⌘4</kbd>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/30 shadow-sm">
              <PhaseProgress />
              <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
                <ResizablePanel defaultSize={42} minSize={28} className="min-h-0">
                  <ChatPanel />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={58} minSize={32} className="min-h-0">
                  <ThoughtChain />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border/60 bg-card/30 p-3 shadow-sm">
              <ToolsPanel />
            </div>
          </TabsContent>

          <TabsContent value="memory" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border/60 bg-card/30 shadow-sm">
              <MemoryPanel />
            </div>
          </TabsContent>

          <TabsContent value="trajectory" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border/60 bg-card/30 shadow-sm">
              <TrajectoryDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="shrink-0 border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              ReAct + LangGraph orchestration
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">6 tools · Zod validation</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">FAISS-equivalent episodic + NetworkX-equivalent graph</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <kbd className="rounded bg-muted-foreground/15 px-1 font-mono text-[9px]">⌘K</kbd>
              focus chat
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <kbd className="rounded bg-muted-foreground/15 px-1 font-mono text-[9px]">⌘⇧K</kbd>
              command palette
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AstraAgent SDK
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Code className="h-3 w-3" />
              Vite · React 18 · SQLite
            </span>
          </div>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={setTab}
        onOpenSettings={openSettings}
        onOpenBenchmark={openBenchmark}
        onToggleDark={toggleDark}
        onFocusChat={focusChatInput}
      />
    </div>
  )
}
