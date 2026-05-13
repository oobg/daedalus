import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#f5f5f0",
          secondary: "#ebebе5",
        },
        border: "#d4d4c8",
      },
    },
  },
  plugins: [],
};

export default config;
