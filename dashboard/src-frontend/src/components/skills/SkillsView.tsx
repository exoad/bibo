// === Skills View Component ===
// List of skills with trigger buttons and feedback
// Supports `compact` mode for the utilitarian dashboard

import { useState } from 'react';
import { useSkills, useTriggerSkill } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { EmptyState } from '../shared/EmptyState';
import { ErrorState } from '../shared/ErrorState';

interface Props {
  compact?: boolean;
  sectionIndex?: number;
}

type SkillStatus = 'idle' | 'triggering' | 'success' | 'error';

export function SkillsView({ compact = false, sectionIndex }: Props) {
  const selectedSection = useConfigStore((s) => s.selectedSection);
  const selectedIndex = useConfigStore((s) => s.selectedIndex);
  const { data: skills, isLoading, error } = useSkills({ enabled: true });
  const triggerMutation = useTriggerSkill();
  const [status, setStatus] = useState<{ [key: string]: SkillStatus }>({});

  const handleTrigger = async (name: string) => {
    setStatus(prev => ({ ...prev, [name]: 'triggering' }));
    try {
      await triggerMutation.mutateAsync({ name });
      setStatus(prev => ({ ...prev, [name]: 'success' }));
      setTimeout(() => setStatus(prev => ({ ...prev, [name]: 'idle' })), 2000);
    } catch {
      setStatus(prev => ({ ...prev, [name]: 'error' }));
      setTimeout(() => setStatus(prev => ({ ...prev, [name]: 'idle' })), 3000);
    }
  };

  if (isLoading && !compact) return <Loading />;
  if (error && !compact) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;
  if (!skills || skills.length === 0) {
    if (compact) return <div className="text-[10px] text-gray py-1">(empty)</div>;
    return <EmptyState message="No skills found." />;
  }

  // Compact mode: flat rows, monospace, inline trigger
  if (compact) {
    return (
      <div className="font-mono">
        {skills.map((skill, i) => {
          const s = status[skill.name] || 'idle';
          return (
            <div
              key={skill.name}
              data-index={i}
              className={`px-1 py-0.5 text-[11px] hover:bg-bg1 ${
                sectionIndex !== undefined && selectedSection === sectionIndex && selectedIndex === i
                  ? 'bg-bg2 border-l-2 border-yellow-bright'
                  : ''
              }`}
            >
              <span className="text-fg1">{skill.name}</span>
              <span className="text-gray ml-2">[{skill.type}]</span>
              {skill.description && (
                <span className="text-fg4 ml-2">{skill.description.substring(0, 60)}</span>
              )}
              <button
                onClick={() => handleTrigger(skill.name)}
                disabled={s === 'triggering'}
                className="ml-2 text-fg4 hover:text-fg2 disabled:opacity-50"
                data-action="trigger"
              >
                [{s === 'triggering' ? '...' : s === 'success' ? '✓' : s === 'error' ? '✗' : 'trigger'}]
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode: original decorated layout
  const getStatusIcon = (name: string) => {
    const s = status[name];
    if (s === 'triggering') return <span className="animate-spin">⏳</span>;
    if (s === 'success') return <span>✓</span>;
    if (s === 'error') return <span>✗</span>;
    return null;
  };

  const getStatusText = (name: string) => {
    const s = status[name];
    if (s === 'triggering') return 'Triggering...';
    if (s === 'success') return 'Done!';
    if (s === 'error') return 'Failed';
    return 'Trigger';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Skills</span>
          <span className="text-sm text-fg4 bg-bg1 px-2.5 py-1">
            {skills.length} skills
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {skills.map((skill) => {
          const currentStatus = status[skill.name] || 'idle';
          const isPending = currentStatus === 'triggering';
          const isSuccess = currentStatus === 'success';
          const isError = currentStatus === 'error';
          return (
            <div
              key={skill.name}
              className={`p-4 bg-bg0-hard border border-bg2 transition-all ${
                isSuccess ? 'border-green/30' : isError ? 'border-red/30' : 'hover:border-green/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-fg1">
                      {skill.name}
                    </span>
                    <span className="text-xs text-fg4 bg-bg1 px-2 py-0.5">
                      {skill.type}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-fg3 mt-1">
                      {skill.description}
                    </p>
                  )}
                  {skill.target_tool && (
                    <p className="text-xs text-fg4 mt-1">
                      Target: {skill.target_tool}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleTrigger(skill.name)}
                  disabled={isPending}
                  className={`px-4 py-2 text-xs flex-shrink-0 font-medium flex items-center gap-1.5 transition-colors ${
                    isSuccess
                      ? 'bg-green text-bg0-hard'
                      : isError
                      ? 'bg-red text-bg0-hard'
                      : isPending
                      ? 'bg-yellow/80 text-bg0-hard'
                      : 'bg-green text-bg0-hard hover:bg-green-bright'
                  }`}
                >
                  {getStatusIcon(skill.name)}
                  {getStatusText(skill.name)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
