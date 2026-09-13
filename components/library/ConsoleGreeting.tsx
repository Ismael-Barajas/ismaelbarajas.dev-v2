import { useEffect } from "react";
import { TERMINAL_ORANGE } from "lib/navLog";

const ART = [
  "██╗███████╗██╗  ██╗██╗   ██╗",
  "██║██╔════╝██║  ██║╚██╗ ██╔╝",
  "██║███████╗███████║ ╚████╔╝ ",
  "██║╚════██║██╔══██║  ╚██╔╝  ",
  "██║███████║██║  ██║   ██║   ",
  "╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ",
].join("\n");

const TAGLINE = "ismaelbarajas.dev · say hi → ismaelbarajas.dev@gmail.com";

const ART_STYLE = `color:${TERMINAL_ORANGE};font-family:monospace;font-size:12px;line-height:1.15`;
const TAGLINE_STYLE = "color:#ffab5e;font-family:monospace;font-size:12px";

/**
 * Prints the calling card into the browser console, once per page load, for
 * anyone who opens devtools. Module-level flag so React's StrictMode double
 * mount in dev doesn't print it twice.
 */
let hasGreeted = false;

const ConsoleGreeting = () => {
  useEffect(() => {
    if (hasGreeted) return;
    hasGreeted = true;
    console.log(`%c${ART}\n%c${TAGLINE}\n`, ART_STYLE, TAGLINE_STYLE);
  }, []);

  return null;
};

export default ConsoleGreeting;
