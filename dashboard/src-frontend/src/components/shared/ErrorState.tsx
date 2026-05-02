// === ErrorState Component ===
// Displayed when there's an error

import { WarningCircle, ArrowClockwise } from '@phosphor-icons/react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-bg1 flex items-center justify-center mb-4">
        <WarningCircle className="w-8 h-8 text-red-bright" weight="fill" />
      </div>
      <h3 className="text-base font-medium text-fg1 mb-1">{title}</h3>
      <p className="text-fg3 text-sm mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 border border-bg2 text-fg1 text-sm font-medium hover:bg-bg1 transition-colors flex items-center gap-1.5"
        >
          <ArrowClockwise className="w-4 h-4" weight="regular" />
          Retry
        </button>
      )}
    </div>
  );
}
