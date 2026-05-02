// === StatusHeader ===
// Minimal top bar: title + model info + uptime

interface Props {
  status?: { model?: string; provider?: string; uptime?: number; version?: string; thinkingLevel?: string };
  uptime: string;
}

export function StatusHeader({ status, uptime }: Props) {
  return (
    <div className="h-[36px] bg-bg0-hard border-b border-bg2 flex items-center px-3 gap-4 shrink-0">
      <span className="text-xs font-bold text-fg4 tracking-wider">BIBO</span>
      <span className="text-[10px] text-bg3">|</span>
      <span className="text-[10px] text-fg3 font-mono">
        {status?.model || '?'}@{status?.provider || '?'}
      </span>
      <span className="text-[10px] text-bg3">|</span>
      <span className="text-[10px] text-fg3 font-mono">{uptime}</span>
      <span className="text-[10px] text-bg3">|</span>
      <span className="text-[10px] text-fg3 font-mono">
        {status?.thinkingLevel || 'off'}
      </span>
      <div className="flex-1" />
      <span className="text-[10px] text-bg4 font-mono">v{status?.version || '?'}</span>
    </div>
  );
}
