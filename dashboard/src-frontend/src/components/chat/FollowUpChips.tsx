// === Follow-up Chips ===
// Suggested next actions after assistant responses

import { useState } from 'react';
import type { ChatMessage } from '../../types';

interface FollowUpChip {
  label: string;
  prompt: string;
  icon?: string;
}

interface FollowUpChipsProps {
  message: ChatMessage;
  onChipClick: (prompt: string) => void;
}

function generateChips(message: ChatMessage): FollowUpChip[] {
  const chips: FollowUpChip[] = [];
  const content = message.content.toLowerCase();

  // Code-related chips
  if (content.includes('```') || content.includes('function') || content.includes('const ')) {
    chips.push(
      { label: 'Explain this code', prompt: 'Explain the code you just generated in detail', icon: '📖' },
      { label: 'Add tests', prompt: 'Write tests for the code you just generated', icon: '🧪' },
      { label: 'Apply to file', prompt: 'Apply this code to the appropriate file', icon: '📝' },
    );
  }

  // Tool call chips
  if (message.toolCalls && message.toolCalls.length > 0) {
    chips.push(
      { label: 'Show full results', prompt: 'Show me the complete results of the tool calls', icon: '📋' },
      { label: 'Run again', prompt: 'Run those tool calls again with the same parameters', icon: '🔄' },
    );
  }

  // Analysis chips
  if (content.includes('analysis') || content.includes('summary') || content.includes('report')) {
    chips.push(
      { label: 'Dig deeper', prompt: 'Provide more detailed analysis on this topic', icon: '🔍' },
      { label: 'Export results', prompt: 'Export these results in a structured format', icon: '📤' },
    );
  }

  // Default chips if none matched
  if (chips.length === 0) {
    chips.push(
      { label: 'Tell me more', prompt: 'Tell me more about this', icon: '💬' },
      { label: 'Be more specific', prompt: 'Can you be more specific and provide examples?', icon: '🎯' },
    );
  }

  return chips.slice(0, 4); // Max 4 chips
}

export function FollowUpChips({ message, onChipClick }: FollowUpChipsProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || message.role !== 'assistant') return null;

  const chips = generateChips(message);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onChipClick(chip.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg0 border border-bg2 text-xs text-fg2 hover:bg-bg1 hover:border-green/30 hover:text-fg1 transition-colors"
        >
          {chip.icon && <span>{chip.icon}</span>}
          <span>{chip.label}</span>
        </button>
      ))}
      <button
        onClick={() => setDismissed(true)}
        className="px-2 py-1.5 text-xs text-fg4 hover:text-fg2"
      >
        ✕
      </button>
    </div>
  );
}
