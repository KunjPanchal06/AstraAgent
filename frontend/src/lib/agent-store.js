// ════════════════════════════════════════════════════════════════
// FILE: lib/agent-store.js
// PURPOSE: Zustand global store for the AstraAgent frontend.
//          Manages connection state, chat messages, thought-chain
//          entries, tool results, and phase tracking.
//          Communicates with the FastAPI backend via REST (fetch).
// EXPORTS: useAgentStore (Zustand hook)
// DEPENDS ON: zustand, sonner (toast notifications)
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { toast } from 'sonner'

export const useAgentStore = create((set, get) => ({
  // ── Connection & session state ──────────────────────────────
  connected: false,
  serviceReady: false,
  running: false,
  currentTaskId: null,
  userId: null,

  // ── Data collections ────────────────────────────────────────
  messages: [],
  thoughts: [],
  cycles: [],
  toolResults: [],
  currentPhase: 'idle',
  plan: [],
  currentSubtask: 0,
  finalAnswer: null,

  // ── Actions ─────────────────────────────────────────────────

  /** Mark the store as connected for a given user session. */
  connect: (userId) => {
    if (userId) set({ userId })
    set({ connected: true, serviceReady: true })
  },

  /** Tear down the active session. */
  disconnect: () => {
    set({ connected: false })
  },

  /**
   * Send a task to the FastAPI backend and process the response.
   * Reads the JWT token from localStorage for authorization.
   * On success, appends the assistant reply to the message history.
   */
  runTask: async (task) => {
    const taskId = 'task-' + Date.now()
    set({ running: true, currentTaskId: taskId })

    // Append the user message immediately for optimistic UI
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: Math.random().toString(36).slice(2),
          role: 'user',
          content: task,
          taskId,
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: task }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Task failed')

      // Append the assistant response
      set({
        finalAnswer: data.message,
        currentPhase: 'complete',
        running: false,
      })
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: Math.random().toString(36).slice(2),
            role: 'assistant',
            content: data.message,
            taskId: data.task_id,
            timestamp: new Date().toISOString(),
          },
        ],
      }))

      toast.success('Task completed', {
        description:
          data.message.slice(0, 80) +
          (data.message.length > 80 ? '…' : ''),
      })
    } catch (err) {
      set({ running: false })
      toast.error('Agent error', { description: err.message })
      console.error('[agent-store] runTask failed:', err)
    }
  },

  /** Abort the currently running task. */
  abortTask: () => {
    set({ running: false })
  },

  /** Reset all transient agent state (keeps messages). */
  reset: () => {
    set({
      thoughts: [],
      cycles: [],
      toolResults: [],
      plan: [],
      currentSubtask: 0,
      finalAnswer: null,
      currentPhase: 'idle',
      currentTaskId: null,
    })
  },
}))