/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Tokens do tema dark "fintech" (Banco Agilize). Um set só — sem toggle.
      colors: {
        bg: "#0b0b11",
        panel: "#14141d",
        panel2: "#1c1c27",
        border: "rgba(255,255,255,.08)",
        text: "#f3f3f8",
        muted: "#9293a8",
        faint: "#62637a",
        accent: "#8b5cf6",
        accent2: "#a855f7",
        chip: "rgba(139,92,246,.16)",
        pos: "#34d399",
        neg: "#fb7185",
      },
      fontFamily: {
        // Display: números/saldos e títulos. Sans: UI/corpo. Self-host via @fontsource-variable.
        display: ["'Space Grotesk Variable'", "system-ui", "sans-serif"],
        sans: ["'Plus Jakarta Sans Variable'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 40px -24px rgba(0,0,0,.7)",
        accent: "0 6px 16px -6px #8b5cf6",
      },
    },
  },
  plugins: [],
};
