// === Vault Note View Component ===
// Display a single vault note with markdown rendering

import { useParams, useNavigate } from 'react-router-dom';
import { useVaultNote } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { ErrorState } from '../shared/ErrorState';
import { ArrowLeft, Notebook } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function VaultNoteView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: note, isLoading, error } = useVaultNote(slug || '', { enabled: !!slug });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => navigate(-1)} />;
  if (!note) return <ErrorState message="Note not found." onRetry={() => navigate(-1)} />;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/vault')}
          className="text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" weight="regular" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Notebook className="w-5 h-5 text-accent" weight="fill" />
            <h1 className="text-lg font-semibold">{note.title || note.slug}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
              {note.type}
            </span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-1.5">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note content */}
      <div className="p-6 bg-white border border-border-light rounded-lg">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
