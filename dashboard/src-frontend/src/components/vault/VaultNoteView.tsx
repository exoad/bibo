// === Vault Note View Component ===
// Display a single vault note with markdown rendering

import { useParams, useNavigate } from 'react-router-dom';
import { useVaultNote } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { ErrorState } from '../shared/ErrorState';
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
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/vault')}
        className="text-sm text-text-muted hover:text-text-primary mb-4 flex items-center gap-1"
      >
        ← Back to vault
      </button>

      <div className="p-4 bg-bg-secondary border border-border-color rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-semibold text-text-primary">
            {note.title || note.slug}
          </h1>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
            {note.type}
          </span>
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className="flex gap-1 mb-3">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
