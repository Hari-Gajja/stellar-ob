import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Instrument Serif", "Georgia", "Times New Roman", "serif"],
        body: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: "#111111",
        muted: "#787774",
        border: "#EAEAEA",
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        accent: "#1F6C9F",
      },
      maxWidth: {
        shell: "1200px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
