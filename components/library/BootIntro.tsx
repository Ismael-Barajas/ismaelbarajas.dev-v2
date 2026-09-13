import { useEffect } from "react";
import { useIntroStage } from "hooks";
import { startIntro } from "lib/introStore";

/**
 * Kicks off the boot intro and shows the skip hint while it plays. The
 * backdrop is CSS (styles/globals.css, keyed off `html[data-intro]`) and the
 * boot screen itself is the NavTerminal panel, centered for the occasion.
 */
const BootIntro = () => {
  const stage = useIntroStage();

  useEffect(() => {
    startIntro();
  }, []);

  if (stage === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-4 right-4 z-[70] font-mono text-[11px] text-[#e6e2dc]/55 transition-opacity duration-300 ${
        stage === "boot" ? "intro-hint" : "opacity-0"
      }`}
    >
      click or press any key to skip
    </div>
  );
};

export default BootIntro;
