// === Brain View Component ===
// Display brain memories grouped by type
// Supports `compact` mode for the utilitarian dashboard

import { useMemo } from 'react';
import { useBrain } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { getMemoryTypeColor } from '../../lib/utils';

interface Props {
  compact?: boolean;
  sectionIndex?: number;
}

export function BrainView({ compact = false, sectionIndex }: Props) {
  const selectedSection = useConfigStore((s) => s.selectedSection);
  const selectedIndex = useConfigStore((s) => s.selectedIndex);
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

  if (isLoading && !compact) return <Loading />;
  if (error && !compact) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!memories || memories.length === 0) {
    if (compact) return <div className="text-[10px] text-gray py-1">(empty)</div>;
    return <EmptyState message="No brain memories found." />;
  }

  // Compact mode: flat list, monospace, no decoration
  if (compact) {
    return (
      <div className="font-mono">
        {Object.entries(groupedMemories)
          .sort(([a], [b]) => a.localeCompare(b))
          .flatMap(([type, mems]) =>
            mems.map((mem, i) => (
              <div
                key={mem.id}
                data-index={i}
                className={`px-1 py-0.5 text-[11px] hover:bg-bg1 ${
                  sectionIndex !== undefined && selectedSection === sectionIndex && selectedIndex === i
                    ? 'bg-bg2 border-l-2 border-yellow-bright'
                    : ''
                }`}
              >
                <span className="text-gray">[{type}]</span>{' '}
                <span className="text-fg1">{mem.text?.substring(0, 120)}{mem.text?.length > 120 ? '...' : ''}</span>
                {mem.created && <span className="text-gray ml-2">{new Date(mem.created).toLocaleDateString()}</span>}
              </div>
            ))
          )}
      </div>
    );
  }

  // Full mode: original decorated layout
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Brain</span>
          <span className="text-sm text-fg4 bg-bg1 px-2.5 py-1">
            {memories.length} memories
          </span>
        </div>
      </div>
      <div className="space-y-6">
        {Object.entries(groupedMemories)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([type, mems]) => {
            return (
              <div key={type}>
                <h2 className="text-sm font-medium text-fg1 mb-3">
                  {type}
                  <span className="text-xs text-fg4 bg-bg1 px-2 py-0.5 ml-2">
                    {mems.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {mems.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 bg-bg0-hard border border-bg2 hover:border-green/30 transition-all"
                    >
                      <p className="text-sm text-fg1 whitespace-pre-wrap">{mem.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium ${getMemoryTypeColor(mem.type)}`}>
                          {mem.type}
                        </span>
                        {mem.created && (
                          <span className="text-xs text-fg4">
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
