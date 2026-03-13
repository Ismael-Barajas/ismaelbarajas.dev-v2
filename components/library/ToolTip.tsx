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

export default function ToolTip({
  content,
  children,
  className,
  spanClassName,
  withUnderline = false,
  position = "bottom",
}: TooltipTextProps) {
  return (
    <RadixTooltip.Provider delayDuration={100}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {withUnderline ? (
            <span
              className={clsx(spanClassName, "underline cursor-default")}
              style={{ textDecorationStyle: "dotted" }}
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
            sideOffset={6}
            className={clsx(
              className,
              "z-50 inline-block p-2 text-text bg-secondary rounded-md shadow-md",
              "border border-[#ed9785]",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-secondary" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
