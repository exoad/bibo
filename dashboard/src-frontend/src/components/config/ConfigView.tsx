// === Config View Component ===
// Dashboard settings form with working theme/layout controls

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
  ListDashes,
  Columns,
} from '@phosphor-icons/react';

export function ConfigView() {
  const { isLoading, error } = useConfig({ enabled: false });
  const updateMutation = useUpdateConfig();
  const pollInterval = useConfigStore((s) => s.pollInterval);
  const setPollInterval = useConfigStore((s) => s.setPollInterval);
  const theme = useConfigStore((s) => s.theme);
  const setTheme = useConfigStore((s) => s.setTheme);
  const layout = useConfigStore((s) => s.layout);
  const setLayout = useConfigStore((s) => s.setLayout);

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
        <GearSix className="w-5 h-5 text-green-bright" weight="fill" />
        <h1 className="text-lg font-semibold">Configuration</h1>
      </div>

      {/* General settings */}
      <div className="p-5 bg-bg0-hard border border-bg2 space-y-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightning className="w-4 h-4 text-green-bright" weight="regular" />
          <h2 className="text-sm font-medium text-fg1">General</h2>
        </div>

        <div>
          <label className="block text-sm text-fg3 mb-1.5">
            Poll Interval (ms)
          </label>
          <input
            type="number"
            value={pollInterval}
            onChange={handlePollIntervalChange}
            className="w-full px-3 py-2 bg-bg1 border border-bg2 text-fg1 text-sm focus:outline-none focus:border-green transition-all"
            min={1000}
            step={1000}
          />
          <p className="text-xs text-fg4 mt-1.5">
            How often to refresh data (default: 5000ms)
          </p>
        </div>

        <div>
          <label className="block text-sm text-fg3 mb-1.5">
            Theme
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'dark'
                  ? 'bg-green text-bg0-hard'
                  : 'bg-bg1 border border-bg2 text-fg3 hover:bg-bg2'
              }`}
            >
              <MoonStars className="w-4 h-4" weight="regular" />
              Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                theme === 'light'
                  ? 'bg-green text-bg0-hard'
                  : 'bg-bg1 border border-bg2 text-fg3 hover:bg-bg2'
              }`}
            >
              <Sun className="w-4 h-4" weight="regular" />
              Light
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-fg3 mb-1.5">
            Layout
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setLayout('list')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                layout === 'list'
                  ? 'bg-green text-bg0-hard'
                  : 'bg-bg1 border border-bg2 text-fg3 hover:bg-bg2'
              }`}
            >
              <ListDashes className="w-4 h-4" weight="regular" />
              List
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                layout === 'grid'
                  ? 'bg-green text-bg0-hard'
                  : 'bg-bg1 border border-bg2 text-fg3 hover:bg-bg2'
              }`}
            >
              <Columns className="w-4 h-4" weight="regular" />
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* About section */}
      <div className="p-5 bg-bg0-hard border border-bg2 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-green-bright" weight="regular" />
          <h2 className="text-sm font-medium text-fg1">About</h2>
        </div>
        <div className="space-y-2 text-sm text-fg3">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-fg4" weight="regular" />
              Version
            </span>
            <span className="text-fg1 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-fg4" weight="regular" />
              Framework
            </span>
            <span className="text-fg1 font-medium">React + Vite + Tailwind</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-fg4" weight="regular" />
              Components
            </span>
            <span className="text-fg1 font-medium">Ant Design + Phosphor Icons</span>
          </div>
        </div>
      </div>
    </div>
  );
}
