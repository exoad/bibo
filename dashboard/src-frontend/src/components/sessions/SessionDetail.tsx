// === Session Detail View ===
// Display full session with all messages and tool calls

import { useParams, Link } from 'react-router-dom';
import { useSession } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

function MessageContent({ content }: { content: string | Record<string, unknown>[] }) {
  if (typeof content === 'string') {
    return <p className="text-sm text-text-primary whitespace-pre-wrap">{content}</p>;
  }
  return <p className="text-sm text-text-primary">[Complex content block]</p>;
}

function ToolCalls({ calls }: { calls?: { name?: string; args?: string | Record<string, unknown>; result?: string | Record<string, unknown> }[] }) {
  if (!calls || calls.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {calls.map((call, i) => (
        <div
          key={i}
          className="text-xs bg-bg-tertiary border border-border-color rounded px-2 py-1"
        >
          <span className="text-text-muted">⚙️ {String(call.name || 'tool_call')}</span>
          {call.args && (
            <pre className="text-text-muted text-xs mt-1 whitespace-pre-wrap">
              {typeof call.args === 'string' ? call.args : JSON.stringify(call.args, null, 2)}
            </pre>
          )}
          {call.result && (
            <pre className="text-text-muted text-xs mt-1 whitespace-pre-wrap">
              {typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useSession(id || '', { enabled: !!id });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!session) return <EmptyState message="Session not found." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/sessions" className="text-sm text-text-muted hover:text-text-primary">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold truncate">{session.title || 'Untitled Session'}</h1>
      </div>

      <div className="text-sm text-text-muted space-y-1">
        <p>Model: {session.modelId || 'unknown'}</p>
        <p>Messages: {session.messageCount}</p>
        <p>Started: {new Date(session.timestamp).toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {(session as any).messages?.map((msg: any, i: number) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${
              msg.role === 'user'
                ? 'bg-blue-950/20 border-blue-900/30'
                : msg.role === 'assistant'
                ? 'bg-green-950/20 border-green-900/30'
                : 'bg-yellow-950/20 border-yellow-900/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-text-muted uppercase">
                {msg.role}
              </span>
              <span className="text-xs text-text-muted">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <MessageContent content={msg.content} />
            <ToolCalls calls={msg.toolCalls} />
          </div>
        ))}
      </div>
    </div>
  );
}


