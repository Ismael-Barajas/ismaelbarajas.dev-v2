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
          sideOffset={8}
          className={clsx(
            className,
            "tooltip-content",
            "z-50 px-3 py-1.5 text-sm text-text",
            "bg-secondary/80 backdrop-blur-md",
            "rounded-lg shadow-lg",
            "border border-primary/20",
            "select-none"
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-secondary/80" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
