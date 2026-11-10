import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				cream: "#f4ecdf",
				ink: "#3e2c22",
				"ink-soft": "#6e5646",
				terracotta: "#e39a74",
				"terracotta-deep": "#c4654a",
				sage: "#c5d3b4",
				"sage-deep": "#6f8664",
				paper: "#fbf6ec",
			},
			fontFamily: {
				display: ["var(--font-display)", "Georgia", "serif"],
				body: ["var(--font-body)", "Nunito", "sans-serif"],
				hand: ["var(--font-hand)", "cursive"],
			},
			boxShadow: {
				paper: "0 10px 24px rgba(90, 60, 40, 0.08)",
			},
		},
	},
	plugins: [],
};
export default config;
