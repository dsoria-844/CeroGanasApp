// Theme management utility for Light / Dark mode

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'qcomo_theme_preference';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  
  // Default to light mode as explicitly requested
  return 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // LocalStorage quota or access restrictions
  }
}
