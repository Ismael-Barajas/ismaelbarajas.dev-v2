module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      rotate: {
        135: "135deg",
        "-135": "-135deg",
      },
      minHeight: {
        "screen-without-nav": "calc(100vh - 4rem)",
        "screen-contact": "calc(100vh - 10rem)",
      },
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        background: "var(--background)",
        text: "var(--text)",
        roseDust: "var(--rose-dust)",
        persianGreen: "var(--persian-green)",
        "secondary-light": "#dfc7ad",
        "secondary-dark": "#5e6088",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24)",
        "h-card": "0 10px 28px rgba(0,0,0,.25), 0 8px 10px rgba(0,0,0,.22)",
        link: "inset 0 -3px 0 var(--primary)",
        "h-link": "inset 0 -20px 0 #c78477",
      },
    },
  },
  plugins: [],
};
