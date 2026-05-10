import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        warm: {
          50:  "#FAFAF7",
          100: "#F5F4EF",
          200: "#ECEAE0",
          300: "#D9D6C8",
        },
        slate: {
          850: "#1A2030",
          950: "#0F1319",
        },
        steel: {
          300: "#8FB8D4",
          400: "#5B9BD5",
          500: "#3D7EAA",
          600: "#2E6491",
        },
      },
      animation: {
        "fade-in":     "fadeIn 0.6s ease forwards",
        "slide-up":    "slideUp 0.5s ease forwards",
        "slide-right": "slideRight 0.4s ease forwards",
        "pulse-soft":  "pulseSoft 2s ease-in-out infinite",
        "float":       "float 3s ease-in-out infinite",
        "grain":       "grain 0.5s steps(1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        grain: {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "10%":      { backgroundPosition: "10% 10%" },
          "20%":      { backgroundPosition: "20% 5%" },
          "30%":      { backgroundPosition: "5% 20%" },
          "40%":      { backgroundPosition: "25% 15%" },
          "50%":      { backgroundPosition: "15% 25%" },
          "60%":      { backgroundPosition: "8% 8%" },
          "70%":      { backgroundPosition: "18% 18%" },
          "80%":      { backgroundPosition: "3% 12%" },
          "90%":      { backgroundPosition: "12% 3%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
