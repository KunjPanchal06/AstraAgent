// ════════════════════════════════════════════════════════════════
// FILE: lib/settings-store.js
// PURPOSE: Zustand store for agent configuration settings.
//          Persists user preferences (maxSteps, enableCritic, etc.)
//          to localStorage and hydrates on app start.
// EXPORTS: useSettingsStore (Zustand hook)
// DEPENDS ON: zustand
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
const DEFAULT_SETTINGS = {
  maxSteps: 6,
  maxReplans: 1,
  enableCritic: true,
  enableEpisodicRetrieval: true,
  enableFactExtraction: true,
  observationTruncate: 1500
};
const STORAGE_KEY = 'agent-settings';
/**
 * Loads agent configuration from localStorage.
 * Falls back to DEFAULT_SETTINGS if missing or invalid.
 * @returns {Object} The loaded settings object.
 */
function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw)
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
/**
 * Persists the agent configuration to localStorage.
 * @param {Object} s - The settings object to save.
 */
function saveSettings(s) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
/**
 * Global store for managing agent settings.
 * Includes methods to hydrate from storage, update, and reset settings.
 */
export const useSettingsStore = create((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadSettings();
    set({
      ...loaded,
      hydrated: true
    });
  },
  update: partial => {
    set(s => {
      const next = {
        ...s,
        ...partial
      };
      const {
        hydrated,
        ...settings
      } = next;
      saveSettings(settings);
      return next;
    });
  },
  reset: () => {
    set({
      ...DEFAULT_SETTINGS,
      hydrated: true
    });
    saveSettings(DEFAULT_SETTINGS);
  }
}));