// === Footer Component ===
// Status bar with polling interval and elapsed time

import { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/configStore';
import {
  Clock,
  Lightning,
  Timer,
} from '@phosphor-icons/react';

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
    <footer className="h-[32px] flex items-center justify-between px-4 bg-bg-secondary border-t border-border-light text-xs text-text-muted flex-shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" weight="regular" />
          Polling: {pollInterval / 1000}s
        </span>
        <span className="flex items-center gap-1.5">
          <Timer className="w-3 h-3" weight="regular" />
          {formatElapsed(elapsed)}
        </span>
      </div>
      <span className="flex items-center gap-1.5">
        <Lightning className="w-3 h-3" weight="regular" />
        Bibo Dashboard v1.0
      </span>
    </footer>
  );
}
