import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Maze Bank brand palette — deep green + gold
        brand: {
          DEFAULT: "#0a3d2e",
          dark: "#061f17",
          light: "#10573f",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e4c06e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
