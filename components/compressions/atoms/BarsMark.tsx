interface Props {
  size?: number | string;
  animated?: boolean;
  className?: string;
  bgFill?: string;
  barFill?: string;
}

const BarsMark = ({
  size = 96,
  animated = true,
  className = "",
  bgFill,
  barFill,
}: Props) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Compressions logo"
    >
      <rect width="1024" height="1024" fill={bgFill ?? "transparent"} />
      <rect
        className={animated ? "c-bar" : undefined}
        style={{ ["--bar-op" as string]: 1 } as React.CSSProperties}
        x="192"
        y="272"
        width="640"
        height="128"
        fill={barFill ?? "var(--c-accent, #d4a053)"}
      />
      <rect
        className={animated ? "c-bar" : undefined}
        style={{ ["--bar-op" as string]: 0.65 } as React.CSSProperties}
        x="288"
        y="448"
        width="448"
        height="128"
        fill={barFill ?? "var(--c-accent, #d4a053)"}
        opacity="0.65"
      />
      <rect
        className={animated ? "c-bar" : undefined}
        style={{ ["--bar-op" as string]: 0.35 } as React.CSSProperties}
        x="384"
        y="624"
        width="256"
        height="128"
        fill={barFill ?? "var(--c-accent, #d4a053)"}
        opacity="0.35"
      />
    </svg>
  );
};

export default BarsMark;
