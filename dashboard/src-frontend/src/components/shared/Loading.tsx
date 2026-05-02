// === Loading Component ===
// Spinner for async operations

export function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-yellow border-t-transparent animate-spin" />
        <span className="text-fg3 text-sm font-mono">loading...</span>
      </div>
    </div>
  );
}
