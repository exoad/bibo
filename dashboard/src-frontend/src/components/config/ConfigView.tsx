// === Config View Component ===
// Dashboard settings form

import { useConfig, useUpdateConfig } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { ErrorState } from '../shared/ErrorState';
import {
  CheckCircle,
  GearSix,
  Info,
  Lightning,
  MoonStars,
  Sun,
} from '@phosphor-icons/react';

export function ConfigView() {
  const { isLoading, error } = useConfig({ enabled: false });
  const updateMutation = useUpdateConfig();
  const pollInterval = useConfigStore((s) => s.pollInterval);
  const setPollInterval = useConfigStore((s) => s.setPollInterval);

  const handlePollIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setPollInterval(value);
      updateMutation.mutate({ pollInterval: value });
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState message={error.message} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <GearSix className="w-5 h-5 text-accent" weight="fill" />
        <h1 className="text-lg font-semibold">Configuration</h1>
      </div>

      {/* General settings */}
      <div className="p-5 bg-white border border-border-light rounded-lg space-y-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightning className="w-4 h-4 text-accent" weight="regular" />
          <h2 className="text-sm font-medium text-text-primary">General</h2>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Poll Interval (ms)
          </label>
          <input
            type="number"
            value={pollInterval}
            onChange={handlePollIntervalChange}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            min={1000}
            step={1000}
          />
          <p className="text-xs text-text-muted mt-1.5">
            How often to refresh data (default: 5000ms)
          </p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Theme
          </label>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors flex items-center gap-1.5">
              <MoonStars className="w-4 h-4" weight="regular" />
              Dark
            </button>
            <button className="px-4 py-2 text-sm bg-bg-tertiary border border-border-color text-text-secondary rounded-lg hover:bg-bg-hover transition-colors flex items-center gap-1.5">
              <Sun className="w-4 h-4" weight="regular" />
              Light
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Layout
          </label>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors">
              List
            </button>
            <button className="px-4 py-2 text-sm bg-bg-tertiary border border-border-color text-text-secondary rounded-lg hover:bg-bg-hover transition-colors">
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* About section */}
      <div className="p-5 bg-white border border-border-light rounded-lg space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-accent" weight="regular" />
          <h2 className="text-sm font-medium text-text-primary">About</h2>
        </div>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-text-muted" weight="regular" />
              Version
            </span>
            <span className="text-text-primary font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-text-muted" weight="regular" />
              Framework
            </span>
            <span className="text-text-primary font-medium">React + Vite + Tailwind</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-text-muted" weight="regular" />
              Components
            </span>
            <span className="text-text-primary font-medium">Ant Design + Phosphor Icons</span>
          </div>
        </div>
      </div>
    </div>
  );
}
