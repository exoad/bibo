// === Header Component ===
// Top bar with search, branding, and status indicator

import { useState } from 'react';
import { useStatus } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import {
  CheckCircle,
  MagnifyingGlass,
  Spinner,
} from '@phosphor-icons/react';

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
      console.log('Search:', searchQuery);
    }
  };

  const isOnline = status?.status === 'online' || status?.status === 'ok';

  return (
    <header className="h-[56px] flex items-center justify-between px-4 bg-white border-b border-border-light flex-shrink-0">
      <div className="flex items-center gap-3 flex-1">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search sessions, brain, vault... (⌘K)"
              className="w-full pl-10 pr-4 py-2 text-sm bg-bg-tertiary border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg">
          {isOnline ? (
            <CheckCircle className="w-4 h-4 text-success" weight="fill" />
          ) : (
            <Spinner className="w-4 h-4 text-text-muted" weight="regular" />
          )}
          <span className="text-xs text-text-secondary">
            {status?.model || 'Model: -'}
          </span>
        </div>
      </div>
    </header>
  );
}
