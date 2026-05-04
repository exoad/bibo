// === Session Detail View ===
// Display full session with all messages, tool calls, usage data, and export

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSession, useExportSession } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  CaretDown,
  CaretUp,
  Code,
  Copy,
  Check,
} from '@phosphor-icons/react';

function MessageContent({ content }: { content: string | Record<string, unknown>[] }) {
  if (!content) return null;

  // Handle array content blocks
  if (Array.isArray(content)) {
    return (
      <div className="space-y-2">
        {content.map((block, i) => {
          if (block.type === 'text' && typeof block.text === 'string') {
            return (
              <div key={i} className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
              </div>
            );
          }
          if (block.type === 'image') {
            const src = (block as any).image_url || (block as any).url;
            const alt = (block as any).alt || 'Image';
            return (
              <div key={i} className="my-2">
                <img src={src} alt={alt} className="max-w-full rounded border border-bg2" />
              </div>
            );
          }
          // Fallback for unknown block types
          return (
            <div key={i} className="text-xs text-fg4 bg-bg1 px-2 py-1 rounded">
              [{String(block.type || 'unknown')}]
            </div>
          );
        })}
      </div>
    );
  }

  // Handle string content - render as markdown
  if (typeof content === 'string') {
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return null;
}

function ToolCalls({ calls }: { calls?: { name?: string; args?: string | Record<string, unknown>; result?: string | Record<string, unknown> }[] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!calls || calls.length === 0) return null;

  const handleCopy = () => {
    const text = calls.map(c => `${c.name}:\n  args: ${JSON.stringify(c.args, null, 2)}\n  result: ${JSON.stringify(c.result, null, 2)}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatValue = (value: string | Record<string, unknown>) => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-fg4 hover:text-fg2 transition-colors mb-1.5"
      >
        {expanded ? <CaretUp className="w-3 h-3" weight="regular" /> : <CaretDown className="w-3 h-3" weight="regular" />}
        <Wrench className="w-3 h-3" weight="regular" />
        <span className="font-medium">{calls.length} tool{calls.length > 1 ? 's' : ''}</span>
      </button>
      {expanded && (
        <div className="space-y-2">
          {calls.map((call, i) => (
            <div key={i} className="bg-bg1 border border-bg2 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Code className="w-3 h-3 text-fg4" weight="regular" />
                  <span className="font-medium text-fg2">{String(call.name || 'tool_call')}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="text-fg4 hover:text-fg2 transition-colors"
                  title="Copy all"
                >
                  {copied ? <Check className="w-3 h-3" weight="regular" /> : <Copy className="w-3 h-3" weight="regular" />}
                </button>
              </div>
              {call.args && (
                <div className="mb-1.5">
                  <div className="text-[10px] text-fg4 uppercase tracking-wider mb-1">Args</div>
                  <pre className="text-fg3 text-xs whitespace-pre-wrap bg-bg0-hard px-2 py-1.5 rounded border border-bg2">
                    {formatValue(call.args)}
                  </pre>
                </div>
              )}
              {call.result && (
                <div>
                  <div className="text-[10px] text-fg4 uppercase tracking-wider mb-1">Result</div>
                  <pre className="text-fg3 text-xs whitespace-pre-wrap bg-bg0-hard px-2 py-1.5 rounded border border-bg2">
                    {formatValue(call.result)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-bg2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-fg4 hover:text-green-bright transition-colors">
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
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 text-xs text-fg3 hover:text-fg1 transition-colors flex items-center gap-1.5"
          >
            <List className="w-3 h-3" weight="regular" />
            View all sessions
          </Link>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="px-3 py-1.5 text-xs bg-green text-bg0-hard hover:bg-green-bright transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3 h-3" weight="regular" />
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </button>
        </div>
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
      <div className="flex-1 overflow-auto">
        <div className="space-y-3 pb-4">
          {messages.map((msg: any, i: number) => {
            const config = roleConfig[msg.role] || roleConfig.system;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className={`p-4 border ${config.bg} rounded-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} weight="fill" />
                    <span className={`text-xs font-medium ${config.color} uppercase tracking-wider`}>
                      {msg.role}
                    </span>
                    <span className="text-xs text-fg4">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <span className="text-xs text-fg4 bg-bg0-hard px-2 py-0.5 rounded">
                      {msg.toolCalls.length} tool{msg.toolCalls.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <MessageContent content={msg.content} />
                <ToolCalls calls={msg.toolCalls} />
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="text-center py-12 text-fg4">
              <p>No messages in this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


