import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "retro-green": "#00FF41",
        "retro-black": "#0c0c0c",
        "gameboy-purple": "rgba(138, 43, 226, 0.8)",
      },
      fontFamily: {
        mono: ['var(--font-vt323)', 'monospace'],
        display: ['var(--font-press-start)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
