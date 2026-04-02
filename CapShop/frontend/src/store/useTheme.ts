import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>((set) => ({
  isDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleTheme: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newDarkMode };
  }),
}));

// Initialize theme on load
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
