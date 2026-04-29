// === Footer Component ===
// Status bar with last updated, polling info, and elapsed time

import { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/configStore';

export function Footer() {
  const [elapsed, setElapsed] = useState(0);
  const pollInterval = useConfigStore((s) => s.pollInterval);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <footer className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-t border-border-color text-xs text-text-muted h-[36px] flex-shrink-0">
      <span>Last updated: {new Date().toLocaleTimeString()}</span>
      <span>Polling: {pollInterval / 1000}s</span>
      <span>⏱️ {formatElapsed(elapsed)}</span>
    </footer>
  );
}
