import { CSSProperties, useEffect, useRef } from "react";
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
}

const TypedText = ({ strings, loop, whiteSpace }: Props) => {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const options = {
      strings: strings,
      typeSpeed: 100,
      backSpeed: 75,
      loop: loop,
    };
    const typed = new Typed(el.current || "", options);
    return () => {
      typed.destroy();
    };
  }, []);

  return <span style={{ whiteSpace: whiteSpace }} ref={el} />;
};

export default TypedText;
