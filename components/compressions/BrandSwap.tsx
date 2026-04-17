import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import TypedText from "components/library/TypedText";
import DecryptedText from "components/library/DecryptedText";

type Stage = "idle" | "deleting" | "decrypting" | "done";

const ORIGINAL = "Ismael Barajas";
const TARGET = "Compressions";

const BrandSwap = () => {
  const router = useRouter();
  const onCompressions = router.pathname === "/compressions";

  const [stage, setStage] = useState<Stage>("idle");
  const [text, setText] = useState(ORIGINAL);

  useEffect(() => {
    if (!onCompressions) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const kickoff = setTimeout(() => {
      setStage("deleting");
      let current = ORIGINAL;
      interval = setInterval(() => {
        current = current.slice(0, -1);
        setText(current);
        if (current.length === 0) {
          if (interval) clearInterval(interval);
          interval = null;
          setStage("decrypting");
        }
      }, 65);
    }, 450);

    return () => {
      clearTimeout(kickoff);
      if (interval) clearInterval(interval);
    };
  }, [onCompressions]);

  if (!onCompressions) {
    return (
      <TypedText
        strings={[ORIGINAL]}
        loop={false}
        whiteSpace={"pre"}
        className={"animated-underline"}
      />
    );
  }

  if (stage === "decrypting" || stage === "done") {
    return (
      <DecryptedText
        text={TARGET}
        animateOn="view"
        sequential
        speed={110}
        revealDirection="start"
        parentClassName="animated-underline"
      />
    );
  }

  return (
    <span className="animated-underline" style={{ whiteSpace: "pre" }}>
      {text}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.55ch",
          marginLeft: "0.05ch",
          background: "currentColor",
          height: "0.95em",
          transform: "translateY(0.1em)",
          opacity: stage === "deleting" ? 1 : 0,
          animation: "blink 1s step-end infinite",
        }}
      />
    </span>
  );
};

export default BrandSwap;
