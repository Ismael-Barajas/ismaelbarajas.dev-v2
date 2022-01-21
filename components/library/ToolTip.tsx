import clsx from "clsx";
import * as React from "react";
import { Tooltip as TippyTooltip, TooltipProps } from "react-tippy";

type TooltipTextProps = {
  content?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  spanClassName?: string;
  withUnderline?: boolean;
} & TooltipProps &
  Omit<React.ComponentPropsWithoutRef<"div">, "children" | "className">;

export default function ToolTip({
  content,
  children,
  className,
  spanClassName,
  withUnderline = false,
  ...rest
}: TooltipTextProps) {
  return (
    <TippyTooltip
      trigger="mouseenter"
      interactive
      animation="perspective"
      html={
        <div
          className={clsx(
            className,
            "inline-block p-2 text-text bg-secondary rounded-md shadow-md",
            "border border-[#ed9785] "
          )}
        >
          {content}
        </div>
      }
      {...rest}
    >
      {withUnderline ? (
        <span
          className={clsx(spanClassName, "underline")}
          style={{ textDecorationStyle: "dotted" }}
        >
          {children}
        </span>
      ) : (
        <>{children}</>
      )}
    </TippyTooltip>
  );
}
