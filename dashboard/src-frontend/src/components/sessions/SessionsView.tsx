// === Sessions List View ===
// Display all sessions as a list with clickable rows to view details

import { Link } from 'react-router-dom';
import { useSessions } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import { ChatCircleText, Clock, List } from '@phosphor-icons/react';

export function SessionsView() {
  const { data: sessions, isLoading, error } = useSessions({ enabled: true });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!sessions || sessions.length === 0) {
    return <EmptyState message="No sessions found." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChatCircleText className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">Sessions</h1>
        </div>
        <span className="text-sm text-text-muted bg-bg-tertiary px-2.5 py-1 rounded-md">
          {sessions.length} total
        </span>
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to={`/sessions/${session.id}`}
            className="block p-4 bg-white border border-border-light rounded-lg hover:border-accent/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                  {session.title || 'Untitled Session'}
                </h3>
                <p className="text-xs text-text-muted mt-1 truncate">
                  {session.preview || 'No messages yet'}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                {session.modelId && (
                  <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                    {session.modelId}
                  </span>
                )}
                <div className="flex items-center justify-end gap-1.5 text-xs text-text-muted">
                  <Clock className="w-3 h-3" weight="regular" />
                  <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-xs text-text-muted">
                  <List className="w-3 h-3" weight="regular" />
                  <span>{session.messageCount} messages</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
