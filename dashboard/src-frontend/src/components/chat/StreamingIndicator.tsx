// === Streaming Indicator ===
// Animated indicator while assistant is responding

export function StreamingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-bg0-hard border border-bg2 p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green flex items-center justify-center">
            <span className="text-bg0-hard text-xs">◆</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-fg4 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-fg4 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-fg4 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-fg4">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
