// === Config View Component ===
// Dashboard settings form

import { useConfig, useUpdateConfig } from '../../hooks/useData';
import { useConfigStore } from '../../stores/configStore';
import { Loading } from '../shared/Loading';
import { ErrorState } from '../shared/ErrorState';

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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Configuration</h1>

      <div className="p-4 bg-bg-secondary border border-border-color rounded-lg space-y-4">
        <h2 className="text-sm font-medium text-text-primary">General</h2>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Poll Interval (ms)
          </label>
          <input
            type="number"
            value={pollInterval}
            onChange={handlePollIntervalChange}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-color rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            min={1000}
            step={1000}
          />
          <p className="text-xs text-text-muted mt-1">
            How often to refresh data (default: 5000ms)
          </p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Theme
          </label>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-bg-active border border-border-light rounded-lg">
              Dark
            </button>
            <button className="px-3 py-1.5 text-sm bg-bg-tertiary border border-border-color rounded-lg text-text-muted hover:bg-bg-hover">
              Light
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Layout
          </label>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-bg-active border border-border-light rounded-lg">
              List
            </button>
            <button className="px-3 py-1.5 text-sm bg-bg-tertiary border border-border-color rounded-lg text-text-muted hover:bg-bg-hover">
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-bg-secondary border border-border-color rounded-lg space-y-3">
        <h2 className="text-sm font-medium text-text-primary">About</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-text-primary">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Framework</span>
            <span className="text-text-primary">React + Vite + Tailwind</span>
          </div>
          <div className="flex justify-between">
            <span>Components</span>
            <span className="text-text-primary">shadcn/ui</span>
          </div>
        </div>
      </div>
    </div>
  );
}
