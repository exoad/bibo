// === Vault View Component ===
// List of vault notes

import { useNavigate } from 'react-router-dom';
import { useVault } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import {
  BookOpen,
  CheckCircle,
  Compass,
  File,
  Notebook,
  Stack,
} from '@phosphor-icons/react';

const typeConfig: Record<string, { icon: typeof Notebook; color: string }> = {
  concept: { icon: BookOpen, color: 'text-accent' },
  reference: { icon: CheckCircle, color: 'text-success' },
  pattern: { icon: Compass, color: 'text-purple' },
  project: { icon: File, color: 'text-warning' },
  log: { icon: File, color: 'text-text-secondary' },
  moc: { icon: Stack, color: 'text-error' },
};

const fileIcon = File;

export function VaultView() {
  const navigate = useNavigate();
  const { data: notes, isLoading, error } = useVault({ enabled: true });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!notes || notes.length === 0) {
    return <EmptyState message="No vault notes found." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Notebook className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">Vault</h1>
        </div>
        <span className="text-sm text-text-muted bg-bg-tertiary px-2.5 py-1 rounded-md">
          {notes.length} notes
        </span>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.map((note) => {
          const config = typeConfig[note.type] || { icon: fileIcon, color: 'text-text-muted' };
          const Icon = config.icon;
          return (
            <button
              key={note.slug}
              onClick={() => navigate(`/vault/${note.slug}`)}
              className="w-full text-left p-4 bg-white border border-border-light rounded-lg hover:border-accent/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.color}`} weight="regular" />
                    <span className="font-medium text-sm text-text-primary group-hover:text-accent transition-colors truncate">
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
                          className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-md"
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
