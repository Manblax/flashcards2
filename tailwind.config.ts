import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#6366f1",
          "primary-content": "#ffffff",
          "base-100": "#0a0e27",
          "base-200": "#141937",
          "base-300": "#1e2549",
          "neutral": "#2a3256",
          "neutral-content": "#a6adbb",
        },
      },
    ],
    darkTheme: "dark",
  },
};

export default config;

