// === Header Component ===
// Top bar with search, branding, status indicator, and ⌘K shortcut

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStatus, useSearch } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import {
  CheckCircle,
  MagnifyingGlass,
  Spinner,
  X,
  Clock,
  Brain,
  Notebook,
} from '@phosphor-icons/react';

export function Header() {
  const { data: status } = useStatus({ enabled: true });
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const setSearchQueryStore = useConfigStore((s) => s.setSearchQuery);

  const { data: searchResults, isLoading: searchLoading } = useSearch(searchQuery, {
    enabled: searchQuery.length >= 2 && showResults,
  });

  // ⌘K / Ctrl+K keyboard shortcut - close search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowResults((v) => !v);
      }
      if (e.key === 'Escape') {
        setShowResults(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close results when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchQueryStore(query);
    if (query.length >= 2) {
      setShowResults(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
    setSearchQueryStore('');
  };

  const isOnline = status?.status === 'online' || status?.status === 'ok';

  // Build search results into actionable items
  const results: { label: string; path: string; icon: typeof Clock }[] = [];
  if (searchResults && !searchLoading) {
    (searchResults as any)?.sessions?.forEach((s: any) => {
      results.push({ label: s.title || 'Untitled Session', path: `/sessions/${s.id}`, icon: Clock });
    });
    (searchResults as any)?.brain?.forEach((m: any) => {
      results.push({ label: m.text?.substring(0, 60) || m.id, path: '/brain', icon: Brain });
    });
    (searchResults as any)?.vault?.forEach((n: any) => {
      results.push({ label: n.title || n.slug, path: `/vault/${n.slug}`, icon: Notebook });
    });
  }

  return (
    <header className="h-[56px] flex items-center justify-between px-4 bg-bg0 border-b border-bg2 flex-shrink-0">
      <div className="flex items-center gap-3 flex-1">
        {/* Search bar */}
        <div className="relative flex-1 max-w-lg" ref={resultsRef}>
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                placeholder="Search sessions, brain, vault... (⌘K)"
                className="w-full pl-10 pr-4 py-2 text-sm bg-bg1 border border-bg2 text-fg1 placeholder-fg4 focus:outline-none focus:border-green transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchQueryStore(''); setShowResults(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg4 hover:text-fg1 transition-colors"
                >
                  <X className="w-4 h-4" weight="regular" />
                </button>
              )}
            </div>
          </form>

          {/* Search results dropdown */}
          {showResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg0-hard border border-bg2 max-h-80 overflow-y-auto z-50">
              {searchLoading ? (
                <div className="p-3 text-sm text-fg4 text-center">Searching...</div>
              ) : results.length > 0 ? (
                <div className="py-1">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleResultClick(r.path)}
                      className="w-full text-left px-3 py-2 text-sm text-fg1 hover:bg-bg1 hover:text-green-bright transition-colors flex items-center gap-2"
                    >
                      <r.icon className="w-4 h-4 text-fg4 flex-shrink-0" weight="regular" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-fg4 text-center">No results found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg1">
          {isOnline ? (
            <CheckCircle className="w-4 h-4 text-green-bright" weight="fill" />
          ) : (
            <Spinner className="w-4 h-4 text-fg4" weight="regular" />
          )}
          <span className="text-xs text-fg3">
            {status?.model || 'Model: -'}
          </span>
        </div>
      </div>
    </header>
  );
}
