// === EmptyState Component ===
// Displayed when there's no data to show

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '📭', title = 'Nothing here', message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
