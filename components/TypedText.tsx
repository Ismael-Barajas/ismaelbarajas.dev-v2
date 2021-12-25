import { useEffect, useRef } from "react";
import Typed from "typed.js";

interface Props {
  strings: string[];
  loop: boolean;
}

const TypedText = ({ strings, loop }: Props) => {
  const el = useRef<HTMLSpanElement>(null);
  //const typed = useRef(null);

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

  return <span style={{ whiteSpace: "pre" }} ref={el} />;
};

export default TypedText;
