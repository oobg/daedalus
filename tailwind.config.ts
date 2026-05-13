import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#FFFFFF",
          1: "#FAFAF9",
          2: "#F7F6F2",
          3: "#F2F1ED",
        },
        border: {
          strong:   "#D8D5CF",
          DEFAULT:  "#E8E6E1",
          subtle:   "#EEEAE3",
        },
        text: {
          primary:   "#1A1A18",
          secondary: "#6B6B65",
          muted:     "#A8A8A2",
          disabled:  "#C4C4BE",
        },
        accent: {
          DEFAULT: "#4A7C6F",
          hover:   "#3D6B60",
          subtle:  "#EAF2F0",
          text:    "#3A6C5F",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        float: "0 4px 12px rgba(0,0,0,0.08)",
      },
      fontSize: {
        micro: ["10px", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
