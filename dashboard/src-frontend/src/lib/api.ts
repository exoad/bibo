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
  getSessions: () => fetchJson<Session[]>('/api/sessions'),
  getSession: (id: string) => fetchJson<SessionDetail>(`/api/sessions/${id}`),
  exportSession: (id: string) => fetchJson<ExportData>(`/api/sessions/${id}/export`),

  // Brain
  getBrain: () => fetchJson<Memory[]>('/api/brain'),

  // Vault
  getVault: () => fetchJson<VaultNote[]>('/api/vault'),
  getVaultNote: (slug: string) => fetchJson<VaultNote>(`/api/vault/${slug}`),

  // Quests
  getQuests: () => fetchJson<Quest[]>('/api/quests'),
  completeQuest: (id: string) =>
    fetchJson<{ success: boolean; quest: Quest }>(`/api/quests/${id}/complete`, {
      method: 'POST',
    }),

  // Status
  getStatus: () => fetchJson<Status>('/api/status'),

  // Skills
  getSkills: () => fetchJson<Skill[]>('/api/skills'),
  triggerSkill: (name: string) =>
    fetchJson<{ success: boolean; skill: Skill }>(`/api/skills/${name}/trigger`, {
      method: 'POST',
    }),

  // Search
  search: (query: string) => fetchJson<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`),

  // Config
  getConfig: () => fetchJson<Config>('/api/config'),
  updateConfig: (config: Partial<Config>) =>
    fetchJson<Config>('/api/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Health
  health: () => fetchJson<{ status: string; uptime: number }>('/api/health'),
  version: () => fetchJson<{ name: string; version: string }>('/api/version'),
};
