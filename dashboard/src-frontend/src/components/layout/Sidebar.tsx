// === Sidebar Component ===
// Navigation items for each view

import { NavLink } from 'react-router-dom';
import { useConfigStore } from '../../stores/configStore';

const navItems = [
  { path: '/sessions', icon: '📋', label: 'Sessions' },
  { path: '/brain', icon: '🧠', label: 'Brain' },
  { path: '/vault', icon: '📚', label: 'Vault' },
  { path: '/quests', icon: '🎯', label: 'Quests' },
  { path: '/skills', icon: '⚡', label: 'Skills' },
  { path: '/config', icon: '⚙️', label: 'Config' },
];

export function Sidebar() {
  const activeView = useConfigStore((s) => s.activeView);

  return (
    <nav className="w-[180px] flex-shrink-0 bg-bg-secondary border-r border-border-color p-2 overflow-y-auto">
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeView === item.path.replace('/', '') as typeof activeView;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => useConfigStore.getState().setActiveView(item.path.replace('/', '') as typeof activeView)}
              className={
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-bg-active text-text-primary'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
