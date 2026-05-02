// === Keyboard Shortcuts ===
// Vim-style keyboard navigation for the dashboard.
// j/k: move up/down within current section
// Ctrl+n/Ctrl+p: next/previous section
// g + s/b/v/q/k/c: jump to view
// Enter: open selected item
// Space: toggle quest complete (in quests)
// t: trigger skill (in skills)
// ?: toggle help overlay
// Esc: close help overlay

import { useEffect, useCallback, useRef } from 'react';
import { useConfigStore } from '../stores/configStore';

const SECTION_COUNT = 5;

export function KeyboardShortcuts() {
  const {
    selectedSection,
    selectedIndex,
    helpOpen,
    setHelpOpen,
    moveUp,
    moveDown,
    nextSection,
    prevSection,
    setSelectedSection,
    setSelectedIndex,
  } = useConfigStore();

  const gPending = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur?.();
        }
        return;
      }

      // Help overlay
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(!helpOpen);
        return;
      }

      if (helpOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      // g-pending navigation (g + letter)
      if (gPending.current) {
        gPending.current = false;
        const key = e.key.toLowerCase();
        const sectionMap: Record<string, number> = {
          q: 0, // quests
          s: 1, // sessions
          b: 2, // brain
          v: 3, // vault
          k: 4, // skills
        };
        if (sectionMap[key] !== undefined) {
          e.preventDefault();
          setSelectedSection(sectionMap[key]);
          setSelectedIndex(0);
          // Scroll section into view
          const sections = document.querySelectorAll('[data-section]');
          sections[sectionMap[key]]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        gPending.current = true;
        // Cancel pending after 1s
        setTimeout(() => { gPending.current = false; }, 1000);
        return;
      }

      // Movement
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          moveUp();
          break;
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            nextSection();
            const sections = document.querySelectorAll('[data-section]');
            sections[Math.min(SECTION_COUNT - 1, selectedSection + 1)]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          break;
        case 'p':
          if (e.ctrlKey) {
            e.preventDefault();
            prevSection();
            const sections = document.querySelectorAll('[data-section]');
            sections[Math.max(0, selectedSection - 1)]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          break;
        case 'Enter':
          e.preventDefault();
          clickSelectedItem(selectedSection, selectedIndex);
          break;
        case ' ': // Space
          e.preventDefault();
          if (selectedSection === 0) {
            // Toggle quest complete
            clickQuestComplete(selectedIndex);
          } else if (selectedSection === 4) {
            // Trigger skill
            clickSkillTrigger(selectedIndex);
          }
          break;
        case 'Escape':
          // Clear selection
          setSelectedSection(0);
          setSelectedIndex(0);
          break;
      }
    },
    [helpOpen, selectedSection, selectedIndex, setHelpOpen, moveUp, moveDown, nextSection, prevSection, setSelectedSection, setSelectedIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    const item = document.querySelector(`[data-section="${selectedSection}"] [data-index="${selectedIndex}"]`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedSection, selectedIndex]);

  if (!helpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg0/90 flex items-center justify-center"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="bg-bg0-hard border border-bg2 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-fg1 mb-4 font-mono">Keyboard Shortcuts</h2>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-fg3">j / ↓</span>
            <span className="text-fg1">Move down</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">k / ↑</span>
            <span className="text-fg1">Move up</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">Ctrl+n</span>
            <span className="text-fg1">Next section</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">Ctrl+p</span>
            <span className="text-fg1">Previous section</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">g + q/s/b/v/k</span>
            <span className="text-fg1">Jump to section</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">Enter</span>
            <span className="text-fg1">Open selected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">Space</span>
            <span className="text-fg1">Toggle quest / trigger skill</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">?</span>
            <span className="text-fg1">Toggle this help</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg3">Esc</span>
            <span className="text-fg1">Close help / clear selection</span>
          </div>
        </div>
        <div className="mt-4 text-[10px] text-gray text-center">
          Press ? or Esc to close
        </div>
      </div>
    </div>
  );
}

function clickSelectedItem(section: number, index: number) {
  const item = document.querySelector(`[data-section="${section}"] [data-index="${index}"]`);
  if (item) {
    (item as HTMLElement).click();
  }
}

function clickQuestComplete(index: number) {
  const btn = document.querySelector(`[data-section="0"] [data-index="${index}"] button[data-action="complete"]`);
  if (btn) {
    (btn as HTMLElement).click();
  }
}

function clickSkillTrigger(index: number) {
  const btn = document.querySelector(`[data-section="4"] [data-index="${index}"] button[data-action="trigger"]`);
  if (btn) {
    (btn as HTMLElement).click();
  }
}
