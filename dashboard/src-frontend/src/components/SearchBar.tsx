// === SearchBar ===
// Global search across sessions, brain, vault.
// Shows results inline in a dropdown.

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface SearchResult {
  type: 'session' | 'brain' | 'vault';
  id: string;
  title: string;
  snippet: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Flatten search results into a unified list
  const resultsList: SearchResult[] = [];
  if (searchResult && typeof searchResult === 'object') {
    const sr = searchResult as { results?: unknown[]; sessions?: unknown[]; brain?: unknown[]; vault?: unknown[] };
    const results = sr.results || sr.sessions || sr.brain || sr.vault;
    if (Array.isArray(results)) {
      for (const item of results as Array<Record<string, unknown>>) {
        const type = item.type || 'session';
        resultsList.push({
          type: type as 'session' | 'brain' | 'vault',
          id: String(item.id || ''),
          title: String(item.title || item.name || item.description || ''),
          snippet: String(item.preview || item.text || item.content || ''),
        });
      }
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShow((v) => !v);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative h-[32px] bg-bg0-hard border-b border-bg2 flex items-center px-3 shrink-0">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder="Search sessions, brain, vault... (cmd+k)"
        className="w-full h-full bg-transparent text-[12px] text-fg1 placeholder-bg4 outline-none font-mono"
      />
      <kbd className="absolute right-2 text-[9px] text-bg4 font-mono">⌘K</kbd>

      {/* Results dropdown */}
      {show && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg0 border border-bg2 max-h-[400px] overflow-auto z-50">
          {isLoading && (
            <div className="px-3 py-2 text-[11px] text-fg4">searching...</div>
          )}
          {!isLoading && resultsList && resultsList.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-fg4">no results</div>
          )}
          {resultsList && resultsList.map((r, i) => (
            <div
              key={i}
              className="px-3 py-2 text-[11px] border-b border-bg1 hover:bg-bg1 cursor-pointer"
              onClick={() => {
                if (r.type === 'session') {
                  window.location.href = `/sessions/${r.id}`;
                } else {
                  window.location.href = `/#/${r.type}/${r.id}`;
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray uppercase w-12">{r.type}</span>
                <span className="text-fg1">{r.title}</span>
              </div>
              {r.snippet && (
                <div className="text-[10px] text-fg4 mt-0.5 truncate">{r.snippet}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
