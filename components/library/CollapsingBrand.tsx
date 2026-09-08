import { useEffect, useState } from "react";

const FULL = "Ismael Barajas";
const SHORT = "ish";
const TYPE_MS = 135;
const DELETE_MS = 65;
const HOLD_FULL_MS = 1200;
const CURSOR_LINGER_MS = 4000;

/**
 * Intro brand for the minimal nav. Types the full name, holds it, backspaces
 * all the way out, types the nickname, lets the cursor blink for a few
 * seconds, then hides the cursor and mutes the name.
 */
const CollapsingBrand = () => {
  const [text, setText] = useState("");
  // Once the intro is finished the cursor hides and the name goes muted.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms);
    };

    const typeTo = (target: string, current: string, done: () => void) => {
      if (current === target) return done();
      const next = target.slice(0, current.length + 1);
      setText(next);
      schedule(() => typeTo(target, next, done), TYPE_MS);
    };

    const deleteTo = (target: string, current: string, done: () => void) => {
      if (current === target) return done();
      const next = current.slice(0, -1);
      setText(next);
      schedule(() => deleteTo(target, next, done), DELETE_MS);
    };

    typeTo(FULL, "", () =>
      schedule(
        () =>
          deleteTo("", FULL, () =>
            typeTo(SHORT, "", () =>
              schedule(() => setSettled(true), CURSOR_LINGER_MS),
            ),
          ),
        HOLD_FULL_MS,
      ),
    );

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    // The color lives on this wrapper: .animated-underline pins its own
    // transition to background-size, which would block a color fade.
    <span
      className={`inline-block transition-colors duration-1000 ease-out ${
        settled ? "text-gray-500 dark:text-gray-400" : ""
      }`}
    >
      <span className="animated-underline" style={{ whiteSpace: "pre" }}>
        {text}
        <span
          aria-hidden="true"
          className="brand-cursor"
          style={settled ? { animation: "none", opacity: 0 } : undefined}
        >
          |
        </span>
      </span>
    </span>
  );
};

export default CollapsingBrand;
