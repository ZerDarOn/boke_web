import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

/** 跟随 document.documentElement 的 dark class */
export function useThemeClass(): ThemeMode {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
