/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Polished neutral" direction: a warm-neutral ground with one
        // deliberate accent, replacing generic Tailwind gray/blue defaults.
        ink: {
          DEFAULT: "#1c2027",
          soft: "#5b6270",
        },
        paper: "#f7f5f1",
        line: "#e7e4dd",
        chip: "#f1efe9",
        accent: {
          tint: "#eef1fa",
          tint2: "#dfe6f7",
          DEFAULT: "#33508f",
          50: "#eef1fa",
          100: "#dfe6f7",
          500: "#33508f",
          600: "#2a4272",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,32,39,0.04), 0 8px 20px -12px rgba(28,32,39,0.12)",
        "card-selected":
          "0 1px 2px rgba(28,32,39,0.04), 0 10px 24px -10px rgba(51,80,143,0.28)",
        block: "0 1px 3px rgba(28,32,39,0.04), 0 16px 40px -20px rgba(28,32,39,0.18)",
        thumb: "0 1px 4px rgba(28,32,39,0.25), 0 0 0 1px #e7e4dd",
        cta: "0 6px 16px -6px rgba(51,80,143,0.55)",
      },
    },
  },
  plugins: [],
};
