// === Quests View Component ===
// List of quests with completion status

import { useQuests, useCompleteQuest } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

import {
  CheckCircle,
  Clock,
  Flag,
  Trash,
} from '@phosphor-icons/react';

const statusConfig: Record<string, { icon: typeof Flag; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-accent', bg: 'bg-blue-50 border-blue-200', label: 'Pending' },
  done: { icon: CheckCircle, color: 'text-success', bg: 'bg-green-50 border-green-200', label: 'Done' },
  cancelled: { icon: Trash, color: 'text-error', bg: 'bg-red-50 border-red-200', label: 'Cancelled' },
};

export function QuestsView() {
  const { data: quests, isLoading, error } = useQuests({ enabled: true });
  const completeMutation = useCompleteQuest();

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!quests || quests.length === 0) {
    return <EmptyState message="No quests found." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">Quests</h1>
        </div>
        <span className="text-sm text-text-muted bg-bg-tertiary px-2.5 py-1 rounded-md">
          {quests.length} quests
        </span>
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((quest) => {
          const status = statusConfig[quest.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <div
              key={quest.id}
              className={`p-4 bg-white border rounded-lg transition-all ${
                quest.status === 'done' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon className={`w-4 h-4 ${status.color}`} weight="fill" />
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {quest.type && (
                      <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                        {quest.type}
                      </span>
                    )}
                    {quest.priority && (
                      <span className="text-xs text-text-muted">{quest.priority}</span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary">{quest.description}</p>
                  {quest.project && (
                    <p className="text-xs text-text-muted mt-1">Project: {quest.project}</p>
                  )}
                </div>
                {quest.status !== 'done' && (
                  <button
                    onClick={() => handleComplete(quest.id)}
                    disabled={completeMutation.isPending}
                    className="px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accent-hover transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
