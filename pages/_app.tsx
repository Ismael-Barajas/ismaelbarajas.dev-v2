import "styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Layout } from "components";
import * as RadixTooltip from "@radix-ui/react-tooltip";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider enableSystem={false} attribute="class">
      <RadixTooltip.Provider delayDuration={100}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RadixTooltip.Provider>
    </ThemeProvider>
  );
}

export default MyApp;
