// === Sidebar Component ===
// Navigation with Phosphor icons and antd-inspired styling (responsive)

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useConfigStore } from '../../stores/configStore';
import {
  BookOpen,
  Brain,
  Clipboard,
  Compass,
  Gear,
  Notebook,
  List,
  X,
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
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg0-hard border border-bg2"
      >
        {isOpen ? <X className="w-5 h-5 text-fg1" /> : <List className="w-5 h-5 text-fg1" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-bg0/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <nav className={`fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-[260px] lg:w-[220px] bg-bg0-hard border-r border-bg2 flex flex-col transform lg:transform-none transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } top-[56px] lg:top-0 h-[calc(100vh-88px)] lg:h-auto overflow-y-auto`}>
        {/* Logo area */}
        <div className="px-4 py-4 border-b border-bg2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green flex items-center justify-center">
              <span className="text-bg0-hard text-sm font-bold">◆</span>
            </div>
            <span className="font-semibold text-sm text-fg1">Bibo</span>
            <span className="text-xs text-fg4 ml-auto">v1.0</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-fg4">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-2 px-2">
          <div className="text-xs font-medium text-fg4 uppercase tracking-wider px-2 mb-2">
            Menu
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeView === item.path.replace('/', '');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    useConfigStore.getState().setActiveView(item.path.replace('/', '') as typeof activeView);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'bg-green text-bg0-hard font-medium'
                      : 'text-fg3 hover:bg-bg1 hover:text-fg1'
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
    </>
  );
}
