// === Message Feedback ===
// Thumbs up/down feedback buttons for assistant messages

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';

interface MessageFeedbackProps {
  messageId: string;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
}

export function MessageFeedback({ messageId, onFeedback }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (feedback === type) {
      // Toggle off
      setFeedback(null);
      return;
    }
    setFeedback(type);
    onFeedback?.(messageId, type);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback('positive')}
        className={`p-1 transition-colors ${
          feedback === 'positive'
            ? 'text-green'
            : 'text-fg4 hover:text-green'
        }`}
        title="Good response"
      >
        <ThumbsUp className="w-3.5 h-3.5" weight={feedback === 'positive' ? 'fill' : 'regular'} />
      </button>
      <button
        onClick={() => handleFeedback('negative')}
        className={`p-1 transition-colors ${
          feedback === 'negative'
            ? 'text-red'
            : 'text-fg4 hover:text-red'
        }`}
        title="Poor response"
      >
        <ThumbsDown className="w-3.5 h-3.5" weight={feedback === 'negative' ? 'fill' : 'regular'} />
      </button>
    </div>
  );
}
