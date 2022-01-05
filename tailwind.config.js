module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
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
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        background: "var(--background)",
        text: "var(--text)",
        roseDust: "var(--rose-dust)",
        persianGreen: "var(--persian-green)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24)",
        "h-card": "0 10px 28px rgba(0,0,0,.25), 0 8px 10px rgba(0,0,0,.22)",
        link: "inset 0 -3px 0 var(--primary)",
        "h-link": "inset 0 -20px 0 var(--primary)",
        // "link-dark": "inset 0 -4px 0 #b55400",
        // "link-dark-hover": "inset 0 -18px 0 #b55400",
      },
    },
  },
  // variants: {
  //   extend: { ringWidth: ["hover", "active"] },
  // },
  plugins: [],
};
