// === Quests View Component ===
// List of quests with completion status, steps, and progress tracking
// Supports `compact` mode for the utilitarian dashboard

import { useQuests, useCompleteQuest } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

interface Props {
  compact?: boolean;
  sectionIndex?: number;
}

export function QuestsView({ compact = false, sectionIndex }: Props) {
  const selectedSection = useConfigStore((s) => s.selectedSection);
  const selectedIndex = useConfigStore((s) => s.selectedIndex);
  const { data: quests, isLoading, error } = useQuests({ enabled: true });
  const completeMutation = useCompleteQuest();

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  if (isLoading && !compact) return <Loading />;
  if (error && !compact) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!quests || quests.length === 0) {
    if (compact) return <div className="text-[10px] text-gray py-1">(empty)</div>;
    return <EmptyState message="No quests found." />;
  }

  // Compact mode: flat rows, monospace, inline complete button
  if (compact) {
    return (
      <div className="font-mono">
        {quests.map((q, i) => (
          <div
            key={q.id}
            data-index={i}
            className={`px-1 py-0.5 text-[11px] hover:bg-bg1 ${
              sectionIndex !== undefined && selectedSection === sectionIndex && selectedIndex === i
                ? 'bg-bg2 border-l-2 border-yellow-bright'
                : ''
            }`}
          >
            <span className={q.status === 'done' ? 'text-gray line-through' : 'text-fg4'}>
              [{q.status === 'done' ? '✓' : q.status === 'cancelled' ? '✗' : '○'}]
            </span>{' '}
            <span className="text-fg1">{q.description}</span>
            {q.type && <span className="text-gray ml-2">[{q.type}]</span>}
            {q.status !== 'done' && (
              <button
                onClick={() => handleComplete(q.id)}
                disabled={completeMutation.isPending}
                className="text-fg4 ml-2 hover:text-fg2 disabled:opacity-50"
                data-action="complete"
              >
                [complete]
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Full mode: original decorated layout
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'text-yellow-bright', label: 'Pending' },
    done: { color: 'text-green-bright', label: 'Done' },
    cancelled: { color: 'text-red-bright', label: 'Cancelled' },
  };

  const completedCount = quests.filter(q => q.status === 'done').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Quests</span>
          <span className="text-xs text-fg4 ml-2">
            {completedCount}/{quests.length} completed
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-bg1 overflow-hidden">
            <div
              className="h-full bg-green transition-all"
              style={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-fg4 bg-bg1 px-2.5 py-1">
            {quests.length} quests
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {quests.map((quest) => {
          const status = statusConfig[quest.status] || statusConfig.pending;
          return (
            <div
              key={quest.id}
              className={`p-4 bg-bg0-hard border border-bg2 transition-all ${
                quest.status === 'done' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {quest.type && (
                      <span className="text-xs text-fg4 bg-bg1 px-2 py-0.5">
                        {quest.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg1">{quest.description}</p>
                  {quest.project && (
                    <p className="text-xs text-fg4 mt-1">Project: {quest.project}</p>
                  )}
                </div>
                {quest.status !== 'done' && (
                  <button
                    onClick={() => handleComplete(quest.id)}
                    disabled={completeMutation.isPending}
                    className="px-3 py-1.5 text-xs bg-green text-bg0-hard hover:bg-green-bright transition-colors flex-shrink-0 disabled:opacity-50"
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
