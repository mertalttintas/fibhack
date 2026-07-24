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
        // Fibabanka açık tema: mavi (kurumsal) + limon yeşili (aksiyon)
        fteal: {
          DEFAULT: "#0069B4",
          light: "#0A79C4",
          dim: "#004E86",
        },
        fgreen: {
          DEFAULT: "#7AB929",
          light: "#568D12",
        },
        coral: "#D3365F",
        amber: "#B45309",
        // Okunabilirlik: açık zeminde gri metinler bir ton koyulaştırıldı
        // (slate-400 → varsayılan 500 değeri, 500 → 600, 600 → 700, 700 → 800)
        slate: {
          400: "#64748B",
          500: "#475569",
          600: "#334155",
          700: "#1E293B",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-teal": "0 0 24px -4px rgba(0,105,180,0.25)",
        "glow-teal-sm": "0 0 12px -2px rgba(0,105,180,0.18)",
        "glow-green": "0 0 20px -4px rgba(122,185,41,0.3)",
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
