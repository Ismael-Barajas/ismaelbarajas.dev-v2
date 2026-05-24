import { useEffect, useMemo, useRef } from "react";
import Typed from "typed.js";

interface Props {
  strings: string[];
  loop: boolean;
  whiteSpace:
    | "normal"
    | "pre"
    | "nowrap"
    | "pre-wrap"
    | "pre-line"
    | "break-spaces";
  className?: string;
  typeSpeed?: number;
}

const TypedText = ({
  strings,
  loop,
  whiteSpace,
  className,
  typeSpeed,
}: Props) => {
  const el = useRef<HTMLSpanElement>(null);
  // Stabilize the strings array reference so the effect doesn't re-run on every render
  const stableStringsKey = JSON.stringify(strings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableStrings = useMemo(() => strings, [stableStringsKey]);

  useEffect(() => {
    const options = {
      strings: stableStrings,
      typeSpeed: typeSpeed ? typeSpeed : 100,
      backSpeed: 75,
      loop: loop,
    };
    const typed = new Typed(el.current || "", options);
    return () => {
      typed.destroy();
    };
  }, [stableStrings, loop, typeSpeed]);

  return (
    <span
      className={`${className ? className : ""}`}
      style={{ whiteSpace: whiteSpace }}
      ref={el}
    />
  );
};

export default TypedText;
