import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

/** Frosted surface shared by cards and panels. No border, soft shadow. */
export const FROSTED_CARD =
  "rounded-2xl bg-[#E0E0E0]/60 text-text shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:bg-[#141214]/60";

export type ButtonVariant = "primary" | "frosted" | "ghost";

const BASE =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 font-medium transition-[background-color,color,translate,scale,box-shadow] duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text";

const VARIANT: Record<ButtonVariant, string> = {
  // The one action that matters: solid in the page's text color.
  primary: "bg-text text-background hover:opacity-90",
  // Secondary: the same translucent surface as the nav controls.
  frosted:
    "bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]",
  // Tertiary: text only.
  ghost:
    "text-gray-600 hover:text-text dark:text-gray-400 dark:hover:text-text",
};

type Common = {
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
};

type AnchorProps = Common & ComponentPropsWithoutRef<"a"> & { href: string };
type NativeProps = Common &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

/** Pill button. Renders an anchor when given an href. */
export const Button = (props: AnchorProps | NativeProps) => {
  const { variant = "frosted", className, children, ...rest } = props;
  const cls = clsx(
    BASE,
    "rounded-full px-4 py-2 text-sm",
    VARIANT[variant],
    className,
  );
  if ("href" in rest && rest.href) {
    return (
      <a className={cls} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
};

const ICON_SIZE = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-14 w-14",
} as const;

type IconCommon = Common & {
  size?: keyof typeof ICON_SIZE;
  /** Required: icon-only controls need a spoken name. */
  "aria-label": string;
};
type IconAnchorProps = IconCommon &
  ComponentPropsWithoutRef<"a"> & { href: string };
type IconNativeProps = IconCommon &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

/** Circular icon-only button, matching the theme toggle. */
export const IconButton = (props: IconAnchorProps | IconNativeProps) => {
  const {
    variant = "frosted",
    size = "md",
    className,
    children,
    ...rest
  } = props;
  const cls = clsx(
    BASE,
    "rounded-full",
    ICON_SIZE[size],
    VARIANT[variant],
    className,
  );
  if ("href" in rest && rest.href) {
    return (
      <a className={cls} {...(rest as ComponentPropsWithoutRef<"a">)}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
};

export default Button;
