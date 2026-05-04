// === ThemeToggle Component ===
// Simple dark/light theme toggle with localStorage persistence

import { useState, useEffect } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('bibo-theme');
    if (saved === 'light' || saved === 'dark') return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('bibo-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('bibo-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="fixed bottom-4 left-4 w-10 h-10 bg-bg0-hard border border-bg2 text-fg1 rounded-full flex items-center justify-center shadow-lg hover:bg-bg1 transition-colors z-40"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}