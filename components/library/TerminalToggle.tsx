import { useIsMounted, useNavLogView } from "hooks";
import { ToolTip } from "..";
import { FiTerminal } from "react-icons/fi";
import { setView } from "lib/navLog";
import type { ToggleStyle } from "./ThemeToggle";

const BUTTON: Record<ToggleStyle, string> = {
  ghost:
    "h-9 w-9 rounded-lg text-gray-500 hover:text-text dark:text-gray-400 dark:hover:text-text",
  frosted:
    "h-9 w-9 rounded-full bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]",
  classic: "h-9 w-9 rounded-lg bg-primary text-blue-100",
};

/**
 * Shows or hides the navigation terminal. Sits beside the effects and theme
 * toggles; the icon dims while the panel is hidden so the state reads at a
 * glance.
 */
const TerminalToggle = ({ variant = "frosted" }: { variant?: ToggleStyle }) => {
  const view = useNavLogView();
  const isMounted = useIsMounted();
  const hidden = view === "hidden";
  const label = hidden ? "Show terminal" : "Hide terminal";

  return (
    <ToolTip position="bottom" content={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={!hidden}
        className={`order-2 flex cursor-pointer items-center justify-center transition-colors duration-500 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text md:order-3 ${BUTTON[variant]}`}
        onClick={() => setView(hidden ? "expanded" : "hidden")}
      >
        {isMounted.current && (
          <FiTerminal
            aria-hidden="true"
            className={`h-5 w-5 transition-opacity duration-300 ${
              hidden ? "opacity-45" : "opacity-100"
            }`}
          />
        )}
      </button>
    </ToolTip>
  );
};

export default TerminalToggle;
