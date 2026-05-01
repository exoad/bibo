// === Session Detail View ===
// Display full session with all messages and tool calls

import { useParams, Link } from 'react-router-dom';
import { useSession } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import {
  ArrowLeft,
  ChatCircleText,
  Clock,
  List,
  Robot,
  User,
  Wrench,
} from '@phosphor-icons/react';

function MessageContent({ content }: { content: string | Record<string, unknown>[] }) {
  if (typeof content === 'string') {
    return <p className="text-sm text-text-primary whitespace-pre-wrap">{content}</p>;
  }
  return <p className="text-sm text-text-primary">[Complex content block]</p>;
}

function ToolCalls({ calls }: { calls?: { name?: string; args?: string | Record<string, unknown>; result?: string | Record<string, unknown> }[] }) {
  if (!calls || calls.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {calls.map((call, i) => (
        <div
          key={i}
          className="bg-bg-tertiary border border-border-light rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
            <Wrench className="w-3 h-3" weight="regular" />
            <span className="font-medium">{String(call.name || 'tool_call')}</span>
          </div>
          {call.args && (
            <pre className="text-text-muted text-xs whitespace-pre-wrap bg-bg-primary rounded px-2 py-1.5">
              {typeof call.args === 'string' ? call.args : JSON.stringify(call.args, null, 2)}
            </pre>
          )}
          {call.result && (
            <pre className="text-text-muted text-xs whitespace-pre-wrap bg-bg-primary rounded px-2 py-1.5 mt-1.5">
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

  const messages = (session as any).messages || [];
  const roleConfig: Record<string, { icon: typeof User; color: string; bg: string }> = {
    user: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    assistant: { icon: Robot, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    system: { icon: ChatCircleText, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/sessions" className="text-text-muted hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" weight="regular" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold truncate">{session.title || 'Untitled Session'}</h1>
          <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
            <span>Model: {session.modelId || 'unknown'}</span>
            <span className="flex items-center gap-1">
              <List className="w-3 h-3" weight="regular" />
              {session.messageCount} messages
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" weight="regular" />
              {new Date(session.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg: any, i: number) => {
          const config = roleConfig[msg.role] || roleConfig.system;
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-lg border ${config.bg}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${config.color}`} weight="fill" />
                <span className={`text-xs font-medium ${config.color} uppercase`}>
                  {msg.role}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <MessageContent content={msg.content} />
              <ToolCalls calls={msg.toolCalls} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


