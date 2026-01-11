export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        logoIntro: "logoIntro 1.4s ease-out forwards",
      },
      keyframes: {
        logoIntro: {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0",
          },
          "70%": {
            transform: "scale(1.08)",
            opacity: "1",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [],
}


