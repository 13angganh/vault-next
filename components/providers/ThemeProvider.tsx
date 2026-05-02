'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { lsGet, lsSet, LS_THEME } from '@/lib/storage';

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

// F4-01: Tentukan tema awal — ikut system preference jika tidak ada saved preference
const getInitialTheme = (): Theme => {
  const saved = lsGet(LS_THEME);
  if (saved === 'dark' || saved === 'light') return saved;
  // Ikut system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark'; // default dark untuk password manager
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // F4-01: Baca dari data-theme (anti-flash script) ATAU fallback ke system preference
    const current = document.documentElement.getAttribute('data-theme') as Theme;
    if (current === 'light' || current === 'dark') {
      setThemeState(current);
    } else {
      // Tidak ada data-theme → pakai getInitialTheme (system preference / saved)
      const initial = getInitialTheme();
      setThemeState(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    lsSet(LS_THEME, t);  // F2-07, F4-01: gunakan LS_THEME dari storage.ts
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
