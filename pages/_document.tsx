import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html data-scroll-behavior="smooth" suppressHydrationWarning>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            // Theme class and performance tier before first paint. Keep in
            // sync with THEME_SCRIPT_HASH in next.config.js (CSP).
            __html: `(function(){try{var d=document.documentElement,t=localStorage.getItem("theme");if(t==="dark")d.classList.add("dark");var p=localStorage.getItem("perf");if(p!=="full"&&p!=="reduced"&&p!=="low")p=sessionStorage.getItem("perf-auto");if(p==="full"||p==="reduced"||p==="low")d.setAttribute("data-perf",p)}catch(e){}})()`,
          }}
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=chillax@600&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
