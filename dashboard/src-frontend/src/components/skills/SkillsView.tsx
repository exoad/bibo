// === Skills View Component ===
// List of skills with trigger buttons

import { useSkills, useTriggerSkill } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

export function SkillsView() {
  const { data: skills, isLoading, error } = useSkills({ enabled: true });
  const triggerMutation = useTriggerSkill();

  const handleTrigger = (name: string) => {
    triggerMutation.mutate({ name });
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!skills || skills.length === 0) {
    return <EmptyState message="No skills found." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Skills</h1>
        <span className="text-sm text-text-secondary">{skills.length} skills</span>
      </div>

      <div className="space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="p-3 bg-bg-secondary border border-border-color rounded-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-text-primary">
                    {skill.name}
                  </span>
                  <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                    {skill.type}
                  </span>
                </div>
                {skill.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {skill.description}
                  </p>
                )}
                {skill.target_tool && (
                  <p className="text-xs text-text-muted mt-1">
                    Target: {skill.target_tool}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleTrigger(skill.name)}
                disabled={triggerMutation.isPending}
                className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {triggerMutation.isPending ? 'Triggering...' : 'Trigger'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
