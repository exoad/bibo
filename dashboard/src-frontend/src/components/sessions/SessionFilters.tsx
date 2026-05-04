// === SessionFilters Component ===
// Filter sessions by date, model, provider, etc.

import { useState } from 'react';
import { Funnel } from '@phosphor-icons/react';

interface SessionFiltersProps {
  onFilterChange: (filters: {
    dateRange: 'all' | 'today' | 'week' | 'month';
    model?: string;
    provider?: string;
    search?: string;
  }) => void;
}

export function SessionFilters({ onFilterChange }: SessionFiltersProps) {
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [model, setModel] = useState('');
  const [provider, setProvider] = useState('');
  const [search, setSearch] = useState('');

  const handleApply = () => {
    onFilterChange({
      dateRange,
      model: model.trim() || undefined,
      provider: provider.trim() || undefined,
      search: search.trim() || undefined,
    });
  };

  const handleReset = () => {
    setDateRange('all');
    setModel('');
    setProvider('');
    setSearch('');
    onFilterChange({ dateRange: 'all' });
  };

  return (
    <div className="bg-bg0-hard border border-bg2 p-3 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Funnel className="w-4 h-4 text-fg4" />
        <span className="text-sm font-medium text-fg1">Filter Sessions</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-fg4 mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full bg-bg0 border border-bg2 text-sm text-fg1 px-2 py-1.5"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-fg4 mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., qwen3.6"
            className="w-full bg-bg0 border border-bg2 text-sm text-fg1 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-fg4 mb-1">Provider</label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g., ollama"
            className="w-full bg-bg0 border border-bg2 text-sm text-fg1 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-fg4 mb-1">Search Text</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in titles/previews"
            className="w-full bg-bg0 border border-bg2 text-sm text-fg1 px-2 py-1.5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs bg-bg1 text-fg1 hover:bg-bg2 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-xs bg-green text-bg0-hard hover:bg-green-bright transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}