// === Skills View Component ===
// List of skills with trigger buttons

import { useSkills, useTriggerSkill } from '../../hooks/useData';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';
import {
  Lightning,
  Wrench,
} from '@phosphor-icons/react';

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightning className="w-5 h-5 text-accent" weight="fill" />
          <h1 className="text-lg font-semibold">Skills</h1>
        </div>
        <span className="text-sm text-text-muted bg-bg-tertiary px-2.5 py-1 rounded-md">
          {skills.length} skills
        </span>
      </div>

      {/* Skills list */}
      <div className="space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="p-4 bg-white border border-border-light rounded-lg hover:border-accent/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lightning className="w-4 h-4 text-accent" weight="regular" />
                  <span className="font-medium text-sm text-text-primary">
                    {skill.name}
                  </span>
                  <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                    {skill.type}
                  </span>
                </div>
                {skill.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {skill.description}
                  </p>
                )}
                {skill.target_tool && (
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                    <Wrench className="w-3 h-3" weight="regular" />
                    Target: {skill.target_tool}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleTrigger(skill.name)}
                disabled={triggerMutation.isPending}
                className="px-4 py-2 text-xs bg-accent text-white rounded-md hover:bg-accent-hover transition-colors flex-shrink-0 disabled:opacity-50 font-medium"
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
