/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050F22",
          900: "#071B36",
          800: "#0A2647",
          700: "#0B2A5B",
          600: "#123A6E",
        },
        fteal: {
          DEFAULT: "#2FB6A6",
          light: "#4FD8C7",
          dim: "#1E7A70",
        },
        fgreen: {
          DEFAULT: "#8DC63F",
          light: "#A8DC62",
        },
        coral: "#E85D75",
        amber: "#F0B429",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-teal": "0 0 24px -4px rgba(47,182,166,0.45)",
        "glow-teal-sm": "0 0 12px -2px rgba(47,182,166,0.35)",
        "glow-green": "0 0 20px -4px rgba(141,198,63,0.4)",
      },
      animation: {
        "spin-slow": "spin 9s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
