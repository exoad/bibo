// === Client State Store (Zustand) ===
// Manages client-side state that doesn't need server synchronization

import { create } from 'zustand';

interface ConfigState {
  pollInterval: number;
  theme: 'dark' | 'light';
  layout: 'list' | 'grid';
  searchQuery: string;
  selectedSessionId: string | null;
  selectedVaultSlug: string | null;
  activeView: 'sessions' | 'brain' | 'vault' | 'quests' | 'skills' | 'config';

  setPollInterval: (interval: number) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLayout: (layout: 'list' | 'grid') => void;
  setSearchQuery: (query: string) => void;
  setSelectedSessionId: (id: string | null) => void;
  setSelectedVaultSlug: (slug: string | null) => void;
  setActiveView: (view: 'sessions' | 'brain' | 'vault' | 'quests' | 'skills' | 'config') => void;
  setSearch: (updates: Partial<Omit<ConfigState, 'activeView'>>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  pollInterval: 5000,
  theme: 'dark',
  layout: 'list',
  searchQuery: '',
  selectedSessionId: null,
  selectedVaultSlug: null,
  activeView: 'sessions',

  setPollInterval: (pollInterval) => set({ pollInterval }),
  setTheme: (theme) => set({ theme }),
  setLayout: (layout) => set({ layout }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),
  setSelectedVaultSlug: (selectedVaultSlug) => set({ selectedVaultSlug }),
  setActiveView: (activeView) => set({ activeView }),
  setSearch: (updates) => set(updates),
}));
