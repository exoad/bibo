// === Quests View Component ===
// List of quests with completion status

import { useQuests, useCompleteQuest } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { getQuestStatusColor } from '../../lib/utils';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  done: 'Done',
  cancelled: 'Cancelled',
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
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Quests</h1>
        <span className="text-sm text-text-secondary">{quests.length} quests</span>
      </div>

      <div className="space-y-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`p-3 bg-bg-secondary border border-border-color rounded-lg ${
              quest.status === 'done' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${getQuestStatusColor(quest.status)}`}>
                    {statusLabels[quest.status] || quest.status}
                  </span>
                  {quest.type && (
                    <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                      {quest.type}
                    </span>
                  )}
                  {quest.priority && (
                    <span className="text-xs text-text-muted">
                      {quest.priority}
                    </span>
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
                  className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-green-600 transition-colors flex-shrink-0"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
