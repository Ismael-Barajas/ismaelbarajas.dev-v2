import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const options = {
      strings: strings,
      typeSpeed: typeSpeed ? typeSpeed : 100,
      backSpeed: 75,
      loop: loop,
    };
    const typed = new Typed(el.current || "", options);
    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <span
      className={`${className ? className : ""}`}
      style={{ whiteSpace: whiteSpace }}
      ref={el}
    />
  );
};

export default TypedText;
