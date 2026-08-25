'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'Use device theme', icon: Monitor },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('blockspace-theme') as Theme | null;
    const nextTheme = savedTheme && themeOptions.some((option) => option.value === savedTheme) ? savedTheme : 'system';
    applyTheme(nextTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (nextTheme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const selectTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    window.localStorage.setItem('blockspace-theme', nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="relative flex items-center rounded-lg border border-border bg-muted/70 p-0.5" aria-label="Color theme">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => selectTheme(option.value)}
            aria-label={option.label}
            aria-pressed={isActive}
            title={option.label}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              isActive ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
      <span className="sr-only">Current theme: {theme}</span>
    </div>
  );
}