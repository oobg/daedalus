import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#FFFFFF",
          1: "#FAFAFD",
          2: "#F5F4FA",
          3: "#EEEDF5",
        },
        border: {
          strong:  "#D3D0E5",
          DEFAULT: "#E2E0EF",
          subtle:  "#ECEAF5",
        },
        text: {
          primary:   "#1C1A2C",
          secondary: "#6B6878",
          muted:     "#A8A5B8",
          disabled:  "#C8C5D5",
        },
        accent: {
          DEFAULT: "#7267C0",
          hover:   "#6257AE",
          subtle:  "#F0EEFF",
          text:    "#5449A0",
        },
        destructive: {
          DEFAULT: "#C0392B",
          bg:      "#FEF2F0",
        },
        warning: {
          DEFAULT: "#D97706",
          bg:      "#FFFBF0",
        },
      },
      borderRadius: {
        sm:  "4px",
        md:  "6px",
        lg:  "8px",
        xl:  "12px",
      },
      boxShadow: {
        float: "0 4px 16px rgba(60, 50, 120, 0.08)",
        sm:    "0 1px 3px rgba(60, 50, 120, 0.05)",
        md:    "0 4px 12px rgba(60, 50, 120, 0.10)",
      },
      fontSize: {
        micro: ["10px", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      transitionDuration: {
        fast: "75ms",
        base: "150ms",
        slow: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
