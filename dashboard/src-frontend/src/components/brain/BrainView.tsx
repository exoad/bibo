// === Brain View Component ===
// Display brain memories grouped by type

import { useMemo } from 'react';
import { useBrain } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { getMemoryTypeColor } from '../../lib/utils';

const typeIcons: Record<string, string> = {
  learning: '📖',
  behavior: '🎭',
  preference: '🎨',
  identity: '🆔',
  user: '👤',
  context: '📌',
  task: '📋',
  reminder: '⏰',
};

export function BrainView() {
  const { data: memories, isLoading, error } = useBrain({ enabled: true });

  const groupedMemories = useMemo(() => {
    if (!memories) return {};
    const groups: Record<string, typeof memories> = {};
    for (const mem of memories) {
      const type = mem.type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(mem);
    }
    return groups;
  }, [memories]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!memories || memories.length === 0) {
    return <EmptyState message="No brain memories found." />;
  }

  const typeLabels: Record<string, string> = {
    learning: 'Learning',
    behavior: 'Behavior',
    preference: 'Preference',
    identity: 'Identity',
    user: 'User',
    context: 'Context',
    task: 'Task',
    reminder: 'Reminder',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Brain</h1>
        <span className="text-sm text-text-secondary">{memories.length} memories</span>
      </div>

      {Object.entries(groupedMemories)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, mems]) => (
          <div key={type}>
            <h2 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
              <span>{typeIcons[type] || '📌'}</span>
              <span>{typeLabels[type] || type}</span>
              <span className="text-xs text-text-muted">({mems.length})</span>
            </h2>
            <div className="space-y-2">
              {mems.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 bg-bg-secondary border border-border-color rounded-lg"
                >
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{mem.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${getMemoryTypeColor(mem.type)}`}>
                      {mem.type}
                    </span>
                    {mem.created && (
                      <span className="text-xs text-text-muted">
                        {new Date(mem.created).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
