import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        poke: {
          yellow: "#FFCB05",
          blue: "#0075BE",
          navy: "#1C2E5A",
          red: "#CC0000",
          light: "#F5F7FA",
          gray: "#E8EDF2",
          dark: "#2A2A2A",
          gold: "#fbbf24",
          fire: "#ef4444",
          water: "#3b82f6",
          grass: "#22c55e",
          electric: "#eab308",
          psychic: "#a855f7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        holoShift: "holoShift 4s linear infinite",
        slideUp: "slideUp 0.6s ease-out forwards",
        slideIn: "slideIn 0.5s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        marquee: "marquee 25s linear infinite",
        bounceSoft: "bounceSoft 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { backgroundPosition: "200% center" },
          "50%": { backgroundPosition: "-200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,117,190,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(0,117,190,0.45)" },
        },
        holoShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      boxShadow: {
        poke: "0 4px 20px rgba(0,117,190,0.15)",
        "poke-lg": "0 8px 40px rgba(0,117,190,0.2)",
        card: "0 2px 12px rgba(28,46,90,0.08)",
        "card-hover": "0 12px 40px rgba(28,46,90,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
