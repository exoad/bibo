// === Vault View Component ===
// List of vault notes
// Supports `compact` mode for the utilitarian dashboard

import { useNavigate } from 'react-router-dom';
import { useVault } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

interface Props {
  compact?: boolean;
  sectionIndex?: number;
}

export function VaultView({ compact = false, sectionIndex }: Props) {
  const selectedSection = useConfigStore((s) => s.selectedSection);
  const selectedIndex = useConfigStore((s) => s.selectedIndex);
  const navigate = useNavigate();
  const { data: notes, isLoading, error } = useVault({ enabled: true });

  if (isLoading && !compact) return <Loading />;
  if (error && !compact) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!notes || notes.length === 0) {
    if (compact) return <div className="text-[10px] text-gray py-1">(empty)</div>;
    return <EmptyState message="No vault notes found." />;
  }

  // Compact mode: flat rows, monospace
  if (compact) {
    return (
      <div className="font-mono">
        {notes.map((note, i) => (
          <button
            key={note.slug}
            onClick={() => navigate(`/vault/${note.slug}`)}
            data-index={i}
            className={`w-full text-left px-1 py-0.5 text-[11px] hover:bg-bg1 hover:text-fg0 transition-colors ${
              sectionIndex !== undefined && selectedSection === sectionIndex && selectedIndex === i
                ? 'bg-bg2 border-l-2 border-yellow-bright'
                : ''
            }`}
          >
            <span className="text-gray">[{note.type}]</span>{' '}
            <span className="text-fg1 truncate">{String(note.name || note.slug)}</span>
            {typeof note.category === 'string' && note.category && (
              <span className="text-fg5 ml-2">({note.category})</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Full mode: original decorated layout
  const typeConfig: Record<string, { color: string }> = {
    concept: { color: 'text-yellow-bright' },
    reference: { color: 'text-green-bright' },
    pattern: { color: 'text-purple-bright' },
    project: { color: 'text-orange-bright' },
    log: { color: 'text-fg3' },
    moc: { color: 'text-red-bright' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Vault</span>
          <span className="text-sm text-fg4 bg-bg1 px-2.5 py-1">
            {notes.length} notes
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {notes.map((note) => {
          const config = typeConfig[note.type] || { color: 'text-fg4' };
          return (
            <button
              key={note.slug}
              onClick={() => navigate(`/vault/${note.slug}`)}
              className="w-full text-left p-4 bg-bg0-hard border border-bg2 hover:border-green/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-fg1 group-hover:text-green-bright transition-colors truncate">
                      {note.title || note.slug}
                    </span>
                    <span className={`text-xs font-medium ${config.color}`}>
                      {note.type}
                    </span>
                  </div>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-bg1 text-fg3 px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
