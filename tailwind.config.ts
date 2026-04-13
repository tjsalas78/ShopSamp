import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          container: "rgb(var(--color-primary-dark) / <alpha-value>)",
          dim: "rgb(var(--color-primary-dim) / <alpha-value>)",
        },
        "on-primary": "rgb(var(--color-on-primary) / <alpha-value>)",
        "on-surface": "rgb(var(--color-on-surface) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          low: "rgb(var(--color-surface-low) / <alpha-value>)",
          variant: "rgb(var(--color-surface-variant) / <alpha-value>)",
          "container-low": "rgb(var(--color-container-low) / <alpha-value>)",
          "container-highest": "rgb(var(--color-container-highest) / <alpha-value>)",
        },
        success: {
          DEFAULT: "#34A853",
          container: "#14532d",
        },
        error: "#EA4335",
        warning: "#FBBC04",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-md": "var(--shadow-card-md)",
        float: "var(--shadow-float)",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
