import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: {
          950: "#0f1115",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
