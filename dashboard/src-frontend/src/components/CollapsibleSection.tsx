// === CollapsibleSection ===
// Flat, collapsible section with a monospace header.
// No decoration, just data.

import { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = false, count, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-bg1 bg-bg0-hard">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-mono text-fg4 hover:text-fg2 hover:bg-bg1 transition-colors"
      >
        <span>{title}</span>
        <span className="text-gray">
          {count !== undefined && <span>{count}</span>}
          <span className="ml-2">{open ? '−' : '+'}</span>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-2 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
