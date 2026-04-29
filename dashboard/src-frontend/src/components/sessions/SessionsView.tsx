// === Sessions List View ===
// Display all sessions as a list with clickable rows to view details

import { Link } from 'react-router-dom';
import { useSessions } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

export function SessionsView() {
  const { data: sessions, isLoading, error } = useSessions({ enabled: true });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!sessions || sessions.length === 0) {
    return <EmptyState message="No sessions found." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Sessions</h1>
        <span className="text-sm text-text-secondary">{sessions.length} sessions</span>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to={`/sessions/${session.id}`}
            className="block p-4 bg-bg-secondary border border-border-color rounded-lg hover:border-border-hover transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {session.title || 'Untitled Session'}
                </h3>
                <p className="text-xs text-text-muted mt-1 truncate">
                  {session.preview || 'No messages yet'}
                </p>
              </div>
              <div className="text-right shrink-0">
                {session.modelId && (
                  <span className="text-xs text-text-muted">{session.modelId}</span>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {new Date(session.timestamp).toLocaleString()}
                </p>
                <span className="text-xs text-text-muted">
                  {session.messageCount} messages
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
