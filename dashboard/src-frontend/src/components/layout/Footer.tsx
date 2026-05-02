// === Footer Component ===
// Status bar with polling interval, current time, and session duration

import { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/configStore';
import {
  Clock,
  Lightning,
  Timer,
} from '@phosphor-icons/react';

export function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStart] = useState(Date.now());
  const pollInterval = useConfigStore((s) => s.pollInterval);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatSessionDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <footer className="h-[32px] flex items-center justify-between px-4 bg-bg0-hard border-t border-bg2 text-xs text-fg4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" weight="regular" />
          Polling: {pollInterval / 1000}s
        </span>
        <span className="flex items-center gap-1.5">
          <Timer className="w-3 h-3" weight="regular" />
          {formatSessionDuration(Date.now() - sessionStart)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" weight="regular" />
          {formatTime(currentTime)}
        </span>
      </div>
      <span className="flex items-center gap-1.5">
        <Lightning className="w-3 h-3" weight="regular" />
        Bibo Dashboard v1.0
      </span>
    </footer>
  );
}
