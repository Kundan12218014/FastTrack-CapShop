export type AppTheme = "light" | "dark";

const THEME_KEY = "capshop-theme";

const hasWindow = typeof window !== "undefined";

export const getPreferredTheme = (): AppTheme => {
  if (!hasWindow) return "light";

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const applyTheme = (theme: AppTheme): void => {
  if (!hasWindow) return;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
};

export const initTheme = (): AppTheme => {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
};
