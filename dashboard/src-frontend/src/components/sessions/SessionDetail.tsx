// === Session Detail View ===
// Display full session with all messages, tool calls, usage data, and export

import { useParams, Link } from 'react-router-dom';
import { useSession, useExportSession } from '../../hooks/useData';
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
  Download,
  Lightning,
  Timer,
} from '@phosphor-icons/react';

function MessageContent({ content }: { content: string | Record<string, unknown>[] }) {
  if (typeof content === 'string') {
    return <p className="text-sm text-fg1 whitespace-pre-wrap">{content}</p>;
  }
  return <p className="text-sm text-fg1">[Complex content block]</p>;
}

function ToolCalls({ calls }: { calls?: { name?: string; args?: string | Record<string, unknown>; result?: string | Record<string, unknown> }[] }) {
  if (!calls || calls.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {calls.map((call, i) => (
        <div
          key={i}
          className="bg-bg1 border border-bg2 px-3 py-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-fg4 mb-1">
            <Wrench className="w-3 h-3" weight="regular" />
            <span className="font-medium">{String(call.name || 'tool_call')}</span>
          </div>
          {call.args && (
            <pre className="text-fg4 text-xs whitespace-pre-wrap bg-bg0-hard px-2 py-1.5">
              {typeof call.args === 'string' ? call.args : JSON.stringify(call.args, null, 2)}
            </pre>
          )}
          {call.result && (
            <pre className="text-fg4 text-xs whitespace-pre-wrap bg-bg0-hard px-2 py-1.5 mt-1.5">
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
  const exportMutation = useExportSession();

  const handleExport = async () => {
    if (!id) return;
    try {
      const data = await exportMutation.mutateAsync(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!session) return <EmptyState message="Session not found." />;

  const messages = (session as any).messages || [];
  const usage = (session as any).usage;
  const roleConfig: Record<string, { icon: typeof User; color: string; bg: string }> = {
    user: { icon: User, color: 'text-yellow-bright', bg: 'bg-bg1 border-bg2' },
    assistant: { icon: Robot, color: 'text-green-bright', bg: 'bg-bg1 border-bg2' },
    system: { icon: ChatCircleText, color: 'text-orange-bright', bg: 'bg-bg1 border-bg2' },
  };

  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/sessions" className="text-fg4 hover:text-green-bright transition-colors">
            <ArrowLeft className="w-5 h-5" weight="regular" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold truncate">{session.title || 'Untitled Session'}</h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-fg4">
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
        <button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="px-3 py-1.5 text-xs bg-green text-bg0-hard hover:bg-green-bright transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Download className="w-3 h-3" weight="regular" />
          {exportMutation.isPending ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {/* Usage info */}
      {usage && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-bg1 border border-bg2">
          {usage.tokens && (
            <span className="text-xs text-fg3 flex items-center gap-1">
              <Lightning className="w-3 h-3" weight="regular" />
              {usage.tokens.toLocaleString()} tokens
            </span>
          )}
          {usage.duration && (
            <span className="text-xs text-fg3 flex items-center gap-1">
              <Timer className="w-3 h-3" weight="regular" />
              Duration: {formatDuration(usage.duration)}
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg: any, i: number) => {
          const config = roleConfig[msg.role] || roleConfig.system;
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`p-4 border ${config.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} weight="fill" />
                  <span className={`text-xs font-medium ${config.color} uppercase`}>
                    {msg.role}
                  </span>
                  <span className="text-xs text-fg4">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <span className="text-xs text-fg4 bg-bg0-hard px-2 py-0.5">
                    {msg.toolCalls.length} tool{msg.toolCalls.length > 1 ? 's' : ''}
                  </span>
                )}
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


