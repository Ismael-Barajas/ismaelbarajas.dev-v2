import clsx from "clsx";
import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

type TooltipTextProps = {
  content?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  spanClassName?: string;
  withUnderline?: boolean;
  position?: "top" | "bottom" | "left" | "right";
};

/**
 * Small frosted label that pops from the trigger's edge. Inverted contrast
 * (dark on light pages, light on dark) so it reads without a border or arrow.
 */
export default function ToolTip({
  content,
  children,
  className,
  spanClassName,
  withUnderline = false,
  position = "bottom",
}: TooltipTextProps) {
  return (
    <RadixTooltip.Provider delayDuration={150} skipDelayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {withUnderline ? (
            <span
              className={clsx(
                spanClassName,
                "cursor-default underline decoration-dotted underline-offset-4",
              )}
            >
              {children}
            </span>
          ) : (
            <span className="inline-flex">{children}</span>
          )}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={8}
            collisionPadding={8}
            className={clsx(
              className,
              "tooltip-content",
              "z-50 select-none rounded-lg px-2.5 py-1.5 text-xs font-medium leading-none",
              "bg-[#141214]/85 text-[#e6e6e6] backdrop-blur-xl",
              "dark:bg-[#e6e6e6]/90 dark:text-[#141214]",
              "shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
            )}
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
