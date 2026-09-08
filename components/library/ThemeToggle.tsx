import useTheme from "hooks/useTheme";
import { useIsMounted } from "hooks";
import { ToolTip } from "..";
import { FiSun } from "react-icons/fi";
import { BsMoonStars } from "react-icons/bs";

export type ToggleStyle = "ghost" | "frosted" | "classic";

const BUTTON: Record<ToggleStyle, string> = {
  // Bare icon in the muted link gray, brightening on hover.
  ghost:
    "h-9 w-9 rounded-lg text-gray-500 hover:text-text dark:text-gray-400 dark:hover:text-text",
  // Translucent circle in the frosted-panel language.
  frosted:
    "h-9 w-9 rounded-full bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]",
  // The original solid square.
  classic: "h-9 w-9 rounded-lg bg-primary text-blue-100",
};

/**
 * Light/dark switch. Ghost and frosted swap the icon with a short rotation;
 * classic keeps the original instant swap.
 */
const ThemeToggle = ({ variant = "frosted" }: { variant?: ToggleStyle }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useIsMounted();
  const isDark = resolvedTheme === "dark";
  const rotate = variant !== "classic";

  const iconBase = "absolute inset-0 h-5 w-5";
  const shown = rotate ? "rotate-0 scale-100 opacity-100" : "opacity-100";
  const hidden = rotate ? "opacity-0 scale-50" : "opacity-0";
  const motionCls = rotate
    ? "transition-[rotate,scale,opacity] duration-500 ease-out"
    : "";

  return (
    <ToolTip position="bottom" content={isDark ? "Light Mode" : "Dark Mode"}>
      <button
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        type="button"
        className={`order-2 flex cursor-pointer items-center justify-center transition-colors duration-500 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text md:order-3 ${BUTTON[variant]}`}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isMounted.current && (
          <span className="relative block h-5 w-5">
            <FiSun
              aria-hidden="true"
              className={`${iconBase} ${motionCls} ${
                isDark ? shown : `${hidden} ${rotate ? "-rotate-90" : ""}`
              }`}
            />
            <BsMoonStars
              aria-hidden="true"
              className={`${iconBase} ${motionCls} ${
                isDark ? `${hidden} ${rotate ? "rotate-90" : ""}` : shown
              }`}
            />
          </span>
        )}
      </button>
    </ToolTip>
  );
};

export default ThemeToggle;
