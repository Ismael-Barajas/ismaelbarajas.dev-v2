module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    container: {
      center: true,
    },
    extend: {
      rotate: {
        135: "135deg",
        "-135": "-135deg",
      },
      minHeight: {
        "screen-without-nav": "calc(100vh - 4rem)",
      },
    },
  },
  variants: {
    extend: { ringWidth: ["hover", "active"] },
  },
  plugins: [],
};
