import "styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Layout } from "components";
import smoothscroll from "smoothscroll-polyfill";

if (typeof window !== "undefined") smoothscroll.polyfill();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider enableSystem={false} attribute="class">
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
