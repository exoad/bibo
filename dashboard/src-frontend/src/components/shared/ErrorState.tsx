// === ErrorState Component ===
// Displayed when there's an error

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <span className="text-3xl mb-3">⚠️</span>
      <h3 className="text-lg font-medium text-error mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-bg-tertiary border border-border-color text-text-primary rounded-lg text-sm hover:bg-bg-hover transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
