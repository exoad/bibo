// === Sessions List View ===
// Display all sessions as a list with clickable rows to view details
// Supports `compact` mode for the utilitarian dashboard

import { Link } from 'react-router-dom';
import { useSessions } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

interface Props {
  compact?: boolean;
  sectionIndex?: number;
}

export function SessionsView({ compact = false, sectionIndex }: Props) {
  const selectedSection = useConfigStore((s) => s.selectedSection);
  const selectedIndex = useConfigStore((s) => s.selectedIndex);
  const { data: sessions, isLoading, error } = useSessions({ enabled: true });

  if (isLoading && !compact) return <Loading />;
  if (error && !compact) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!sessions || sessions.length === 0) {
    if (compact) return <div className="text-[10px] text-gray py-1">(empty)</div>;
    return <EmptyState message="No sessions found." />;
  }

  // Compact mode: flat rows, no decoration
  if (compact) {
    return (
      <div className="font-mono">
        {sessions.slice(0, 30).map((s, i) => (
          <Link
            key={s.id}
            to={`/sessions/${s.id}`}
            data-index={i}
            className={`flex items-center gap-2 px-1 py-0.5 text-[11px] hover:bg-bg1 hover:text-fg0 transition-colors ${
              sectionIndex !== undefined && selectedSection === sectionIndex && selectedIndex === i
                ? 'bg-bg2 border-l-2 border-yellow-bright'
                : ''
            }`}
          >
            <span className="text-gray w-12 shrink-0">{s.id?.slice(0, 8) || '?'}</span>
            <span className="text-fg1 truncate">{s.title || 'Untitled'}</span>
            <span className="text-gray ml-auto shrink-0">{s.messageCount}m</span>
            <span className="text-gray ml-2 shrink-0">{new Date(s.timestamp).toLocaleDateString()}</span>
          </Link>
        ))}
        {sessions.length > 30 && (
          <div className="text-[10px] text-gray py-1">... {sessions.length - 30} more</div>
        )}
      </div>
    );
  }

  // Full mode: original decorated layout
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Sessions</span>
          <span className="text-sm text-fg4 bg-bg1 px-2.5 py-1">
            {sessions.length} total
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to={`/sessions/${session.id}`}
            className="block p-4 bg-bg0-hard border border-bg2 hover:border-green/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-fg1 group-hover:text-green-bright transition-colors truncate">
                  {session.title || 'Untitled Session'}
                </h3>
                <p className="text-xs text-fg4 mt-1 truncate">
                  {session.preview || 'No messages yet'}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                {session.modelId && (
                  <span className="text-xs text-fg4 bg-bg1 px-2 py-0.5">
                    {session.modelId}
                  </span>
                )}
                <div className="text-xs text-fg4">
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
                <div className="text-xs text-fg4">
                  {session.messageCount} messages
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
