// === Sidebar Component ===
// Navigation with Phosphor icons and antd-inspired styling

import { NavLink } from 'react-router-dom';
import { useConfigStore } from '../../stores/configStore';
import {
  BookOpen,
  Brain,
  Clipboard,
  Compass,
  Gear,
  Notebook,
} from '@phosphor-icons/react';

interface NavItem {
  path: string;
  icon: typeof BookOpen;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/sessions', icon: BookOpen, label: 'Sessions' },
  { path: '/brain', icon: Brain, label: 'Brain' },
  { path: '/vault', icon: Notebook, label: 'Vault' },
  { path: '/quests', icon: Clipboard, label: 'Quests' },
  { path: '/skills', icon: Compass, label: 'Skills' },
  { path: '/config', icon: Gear, label: 'Config' },
];

export function Sidebar() {
  const activeView = useConfigStore((s) => s.activeView);

  return (
    <nav className="w-[220px] flex-shrink-0 bg-white border-r border-border-light flex flex-col">
      {/* Logo area */}
      <div className="px-4 py-4 border-b border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-sm font-bold">◆</span>
          </div>
          <span className="font-semibold text-sm text-text-primary">Bibo</span>
          <span className="text-xs text-text-muted ml-auto">v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-2 overflow-y-auto">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-2">
          Menu
        </div>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeView === item.path.replace('/', '');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() =>
                  useConfigStore.getState().setActiveView(item.path.replace('/', '') as typeof activeView)
                }
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive
                    ? 'bg-accent text-white font-medium'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <item.icon weight={isActive ? "fill" : "regular"} className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
