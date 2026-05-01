// === API Client Layer ===
// Typed fetch wrapper for the dashboard REST API

import type {
  Session,
  SessionDetail,
  Memory,
  VaultNote,
  Quest,
  Skill,
  Status,
  Config,
  SearchResults,
  ExportData,
} from '../types';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  return { raw: await res.text() } as unknown as T;
}

export const api = {
  // Sessions
  getSessions: async () => {
    const res = await fetchJson<{ sessions: Session[]; count: number }>('/api/sessions');
    return res.sessions;
  },
  getSession: (id: string) => fetchJson<SessionDetail>(`/api/sessions/${id}`),
  exportSession: (id: string) => fetchJson<ExportData>(`/api/sessions/${id}/export`),

  // Brain
  getBrain: async () => {
    const res = await fetchJson<Record<string, Memory[]>>('/api/brain');
    return Object.values(res).flat();
  },

  // Vault
  getVault: async () => {
    const res = await fetchJson<{ notes: VaultNote[]; count: number }>('/api/vault');
    return res.notes;
  },
  getVaultNote: async (slug: string) => {
    const res = await fetchJson<{ note: VaultNote }>(`/api/vault/${slug}`);
    return res.note;
  },

  // Quests
  getQuests: async () => {
    const res = await fetchJson<{ quests: Quest[] }>('/api/quests');
    return res.quests;
  },
  completeQuest: (id: string) =>
    fetchJson<{ success: boolean; quest: Quest }>(`/api/quests/${id}/complete`, {
      method: 'POST',
    }),

  // Status
  getStatus: () => fetchJson<Status>('/api/status'),

  // Skills
  getSkills: async () => {
    const res = await fetchJson<{ skills: Skill[] }>('/api/skills');
    return res.skills;
  },
  triggerSkill: (name: string) =>
    fetchJson<{ success: boolean; skill: Skill }>(`/api/skills/${name}/trigger`, {
      method: 'POST',
    }),

  // Search
  search: (query: string) => fetchJson<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`),

  // Config
  getConfig: async () => {
    const res = await fetchJson<{ config: Status }>('/api/config');
    return res.config as unknown as Config;
  },
  updateConfig: (config: Partial<Config>) =>
    fetchJson<Config>('/api/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Health
  health: () => fetchJson<{ status: string; uptime: number }>('/api/health'),
  version: () => fetchJson<{ name: string; version: string }>('/api/version'),
};
