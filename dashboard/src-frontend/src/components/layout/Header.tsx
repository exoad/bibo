// === Header Component ===
// Logo, search bar, and status indicator

import { useState } from 'react';
import { useStatus } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';

export function Header() {
  const { data: status } = useStatus({ enabled: true });
  const [searchQuery, setSearchQuery] = useState('');
  const setSearchQueryStore = useConfigStore((s) => s.setSearchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchQueryStore(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results (to be implemented)
      console.log('Search:', searchQuery);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border-color h-[52px] flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="font-bold text-sm tracking-tight flex items-center gap-2">
          <span className="text-accent">◆</span>
          <span>Bibo Dashboard</span>
        </span>
        <span className="text-xs text-text-muted">v1.0</span>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search sessions, brain, vault... (Ctrl+K)"
          className="w-full px-3 py-1.5 text-sm bg-bg-tertiary border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </form>

      <div className="flex items-center gap-3">
        <span className="text-xs text-text-secondary">
          {status?.model || 'Model: -'}
        </span>
        <span className={`w-2 h-2 rounded-full ${status?.status === 'online' || status?.status === 'ok' ? 'bg-success' : 'bg-text-muted'}`} />
      </div>
    </header>
  );
}
