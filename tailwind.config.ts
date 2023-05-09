import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(4deg)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0%" },
          "60%": { transform: "translateY(5%)", opacity: "100%" },
          "100%": { transform: "translateY(0)", opacity: "100%" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0%" },
          "60%": { transform: "translateY(5%)", opacity: "100%" },
          "100%": { transform: "translateY(0)", opacity: "100%" },
        },
        "slide-right": {
          "0%": { transform: "translateX(-100%)", opacity: "0%" },
          "60%": { transform: "translateX(2%)", opacity: "100%" },
          "100%": { transform: "translateX(0)", opacity: "100%" },
        },
        zoom: {
          "0%": { transform: "scale(0%)", opacity: "0%" },
          "100%": { transform: "scale(100%)", opacity: "100%" },
        },
        "blur-in": {
          "0%": { filter: "blur(8px)", opacity: "0%" },
          "100%": { filter: "blur(0)", opacity: "100%" },
        },
      },
      animation: {
        wiggle: "wiggle 80ms ease-in-out",
        "slide-down": "slide-down 220ms ease-in-out",
        "slide-up": "slide-up 220ms ease-in-out",
        "slide-right": "slide-right 220ms ease-in-out",
        zoom: "zoom 220ms ease-in-out",
        "blur-in": "blur-in 220ms ease-in-out",
      }
    },
  },
  plugins: [],
} satisfies Config;
