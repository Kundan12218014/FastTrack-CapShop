/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: "#1B3A6B", light: "#2E5BA8", dark: "#0F2244" },
        accent:   { DEFAULT: "#F97316", light: "#FB923C", dark: "#EA580C" },
        success:  "#16A34A",
        danger:   "#DC2626",
        warning:  "#D97706",
      },
      fontFamily: {
        sans:    ["'DM Sans'", "sans-serif"],
        display: ["'Sora'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
