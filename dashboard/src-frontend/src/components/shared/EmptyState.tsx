// === EmptyState Component ===
// Displayed when there's no data to show

import { Envelope } from '@phosphor-icons/react';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title = 'Nothing here', message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
        <Envelope className="w-8 h-8 text-text-muted" weight="regular" />
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-6 max-w-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
