// === EmptyState Component ===
// Displayed when there's no data to show with context-aware icons

import { Envelope, ChatCircleText, Brain, Notebook, Flag, Wrench, GearSix } from '@phosphor-icons/react';

export type EmptyStateIcon = 'default' | 'sessions' | 'brain' | 'vault' | 'quests' | 'skills' | 'config';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
  icon?: EmptyStateIcon;
}

const iconMap: Record<EmptyStateIcon, typeof Envelope> = {
  default: Envelope,
  sessions: ChatCircleText,
  brain: Brain,
  vault: Notebook,
  quests: Flag,
  skills: Wrench,
  config: GearSix,
};

export function EmptyState({ title = 'Nothing here', message, action, icon = 'default' }: EmptyStateProps) {
  const Icon = iconMap[icon];
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="w-16 h-16 bg-bg1 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-fg4" weight="regular" />
      </div>
      <h3 className="text-base font-medium text-fg1 mb-1">{title}</h3>
      <p className="text-fg3 text-sm mb-6 max-w-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2 bg-bg2 text-fg1 text-sm font-medium hover:bg-bg3 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
