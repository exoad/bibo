// === Vault View Component ===
// List of vault notes

import { useNavigate } from 'react-router-dom';
import { useVault } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

const typeColors: Record<string, string> = {
  concept: 'text-accent',
  reference: 'text-success',
  pattern: 'text-purple',
  project: 'text-warning',
  log: 'text-text-secondary',
  moc: 'text-error',
};

export function VaultView() {
  const navigate = useNavigate();
  const { data: notes, isLoading, error } = useVault({ enabled: true });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!notes || notes.length === 0) {
    return <EmptyState message="No vault notes found." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Vault</h1>
        <span className="text-sm text-text-secondary">{notes.length} notes</span>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <button
            key={note.slug}
            onClick={() => navigate(`/vault/${note.slug}`)}
            className="w-full text-left p-3 bg-bg-secondary border border-border-color rounded-lg hover:bg-bg-hover hover:border-border-light transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-text-primary truncate">
                    {note.title || note.slug}
                  </span>
                  <span className={`text-xs ${typeColors[note.type] || 'text-text-muted'}`}>
                    {note.type}
                  </span>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-bg-tertiary text-text-secondary px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
