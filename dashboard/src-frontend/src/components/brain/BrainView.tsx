// === Brain View Component ===
// Display brain memories grouped by type

import { useMemo } from 'react';
import { useBrain } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { getMemoryTypeColor } from '../../lib/utils';
import {
  BookOpen,
  Brain,
  Clock,
  Compass,
  Flag,
  User,
  UserCircle,
  Users,
} from '@phosphor-icons/react';

const typeConfig: Record<string, { icon: typeof BookOpen; label: string }> = {
  learning: { icon: BookOpen, label: 'Learning' },
  behavior: { icon: Compass, label: 'Behavior' },
  preference: { icon: Flag, label: 'Preference' },
  identity: { icon: UserCircle, label: 'Identity' },
  user: { icon: User, label: 'User' },
  context: { icon: Users, label: 'Context' },
  task: { icon: Flag, label: 'Task' },
  reminder: { icon: Clock, label: 'Reminder' },
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">Brain</h1>
        </div>
        <span className="text-sm text-text-muted bg-bg-tertiary px-2.5 py-1 rounded-md">
          {memories.length} memories
        </span>
      </div>

      {/* Memory groups */}
      <div className="space-y-6">
        {Object.entries(groupedMemories)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([type, mems]) => {
            const config = typeConfig[type] || { icon: Brain, label: type };
            const Icon = config.icon;
            return (
              <div key={type}>
                <h2 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-accent" weight="regular" />
                  <span>{config.label}</span>
                  <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                    {mems.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {mems.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 bg-white border border-border-light rounded-lg hover:border-accent/30 transition-all"
                    >
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{mem.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium ${getMemoryTypeColor(mem.type)}`}>
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
            );
          })}
      </div>
    </div>
  );
}
