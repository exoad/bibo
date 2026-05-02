// === Dashboard Component ===
// Flat, utilitarian, information-dense layout.
// No icons, no decoration. Pure data with collapsible sections.

import { useState, useEffect } from 'react';
import { useStatus } from '../hooks/useData';
import { StatusHeader } from './StatusHeader';
import { SearchBar } from './SearchBar';
import { CollapsibleSection } from './CollapsibleSection';
import { SessionsView } from './sessions/SessionsView';
import { QuestsView } from './quests/QuestsView';
import { BrainView } from './brain/BrainView';
import { VaultView } from './vault/VaultView';
import { SkillsView } from './skills/SkillsView';
import { KeyboardShortcuts } from './KeyboardShortcuts';

export default function Dashboard() {
  const { data: status } = useStatus({ enabled: true });
  // Ticker for live uptime
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const uptimeStr = status ? formatUptime(status.uptime || 0) : '0s';

  return (
    <div className="h-screen flex flex-col bg-bg0 text-fg1 overflow-hidden">
      {/* Top bar: status + search */}
      <StatusHeader status={status} uptime={uptimeStr} />
      <SearchBar />

      {/* Main content: flat sections */}
      <div className="flex-1 overflow-auto p-2">
        <div className="max-w-[1400px] mx-auto space-y-1">
          {/* Quests — always visible, always actionable */}
          <div data-section="0">
            <CollapsibleSection title="QUESTS" defaultOpen>
              <QuestsView compact={true} sectionIndex={0} />
            </CollapsibleSection>
          </div>

          {/* Sessions — show last 20, clickable to expand */}
          <div data-section="1">
            <CollapsibleSection title="SESSIONS" defaultOpen>
              <SessionsView compact={true} sectionIndex={1} />
            </CollapsibleSection>
          </div>

          {/* Brain memories */}
          <div data-section="2">
            <CollapsibleSection title="BRAIN" defaultOpen>
              <BrainView compact={true} sectionIndex={2} />
            </CollapsibleSection>
          </div>

          {/* Vault notes */}
          <div data-section="3">
            <CollapsibleSection title="VAULT">
              <VaultView compact={true} sectionIndex={3} />
            </CollapsibleSection>
          </div>

          {/* Skills */}
          <div data-section="4">
            <CollapsibleSection title="SKILLS">
              <SkillsView compact={true} sectionIndex={4} />
            </CollapsibleSection>
          </div>
        </div>
      </div>

      <KeyboardShortcuts />

      {/* Footer: model info + version */}
      <div className="h-[22px] bg-bg0-hard border-t border-bg2 px-3 flex items-center justify-between text-[10px] text-gray font-mono">
        <span>{status?.model || '?'} · {status?.provider || '?'} · {String(status?.thinkingLevel || 'off')}</span>
        <span>v{String(status?.version || '?')} · {uptimeStr}</span>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}
