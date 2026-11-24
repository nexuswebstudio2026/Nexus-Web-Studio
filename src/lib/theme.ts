import { useEffect, useState } from 'react';

export type AutoThemeMode = 'light' | 'dark';

/**
 * Modo día: 6:00 a. m. a 5:59 p. m. (horas 6..17)
 * Modo noche: 6:00 p. m. a 5:59 a. m. (horas 18..23 y 0..5)
 */
export function isDaytimeHour(hour: number): boolean {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  return normalized >= 6 && normalized < 18;
}

export function getThemeForHour(hour: number): AutoThemeMode {
  return isDaytimeHour(hour) ? 'light' : 'dark';
}

export function applyThemeClass(mode: AutoThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

export function useAutoTheme(): AutoThemeMode {
  const [mode, setMode] = useState<AutoThemeMode>(() => getThemeForHour(new Date().getHours()));

  useEffect(() => {
    const sync = () => {
      const next = getThemeForHour(new Date().getHours());
      setMode(next);
      applyThemeClass(next);
    };
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return mode;
}
