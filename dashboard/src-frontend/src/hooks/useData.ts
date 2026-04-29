// === Custom Hooks (TanStack Query) ===
// Provides cached, auto-refetching data for all dashboard views

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Config } from '../types';

const QUERY_KEYS = {
  sessions: ['sessions'] as const,
  session: (id: string) => ['session', id] as const,
  brain: ['brain'] as const,
  vault: ['vault'] as const,
  vaultNote: (slug: string) => ['vaultNote', slug] as const,
  quests: ['quests'] as const,
  status: ['status'] as const,
  skills: ['skills'] as const,
  config: ['config'] as const,
  search: (query: string) => ['search', query] as const,
} as const;

// Sessions
export function useSessions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: api.getSessions,
    staleTime: 30_000,
    ...options,
  });
}

export function useSession(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.session(id),
    queryFn: () => api.getSession(id),
    enabled: !!id && options?.enabled !== false,
  });
}

export function useExportSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.exportSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });
}

// Brain
export function useBrain(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.brain,
    queryFn: api.getBrain,
    staleTime: 60_000,
    ...options,
  });
}

// Vault
export function useVault(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.vault,
    queryFn: api.getVault,
    staleTime: 60_000,
    ...options,
  });
}

export function useVaultNote(slug: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.vaultNote(slug),
    queryFn: () => api.getVaultNote(slug),
    enabled: !!slug && options?.enabled !== false,
  });
}

// Quests
export function useQuests(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.quests,
    queryFn: api.getQuests,
    staleTime: 30_000,
    ...options,
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quests });
    },
  });
}

// Status
export function useStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.status,
    queryFn: api.getStatus,
    refetchInterval: 5000,
    ...options,
  });
}

// Skills
export function useSkills(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.skills,
    queryFn: api.getSkills,
    staleTime: 60_000,
    ...options,
  });
}

export function useTriggerSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => api.triggerSkill(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills });
    },
  });
}

// Config
export function useConfig(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.config,
    queryFn: api.getConfig,
    ...options,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<Config>) => api.updateConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.config, data);
    },
  });
}

// Search
export function useSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => api.search(query),
    enabled: !!query && query.length >= 2 && options?.enabled !== false,
    staleTime: 30_000,
  });
}
