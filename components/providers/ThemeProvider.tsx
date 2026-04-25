'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme:       Theme;
  toggleTheme: () => void;
  setTheme:    (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:       'dark',
  toggleTheme: () => {},
  setTheme:    () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'vault_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Baca dari data-theme yang sudah di-set oleh anti-flash script di layout.tsx
    const current = document.documentElement.getAttribute('data-theme') as Theme;
    if (current === 'light' || current === 'dark') {
      setThemeState(current);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // TIDAK return null — langsung render children
  // Tema awal sudah ditangani anti-flash script di layout.tsx
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
