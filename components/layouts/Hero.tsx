import clsx from "clsx";
import { useRef } from "react";
import { BackToTop, TypedText, WaveSVG } from "..";

const Hero = () => {
  const heroRef = useRef(null);
  return (
    <section
      id="hero"
      ref={heroRef}
      className="transition-[background-color] duration-700 ease-in-out relative min-h-screen-without-nav items-center content-center flex pb-44 "
    >
      <div className="container">
        <h2 className="font-black text-text text-2xl md:text-4xl 2xl:text-5xl">
          Hi!
        </h2>
        <h1 className="font-black text-text mt-1 text-3xl md:text-5xl 2xl:text-6xl">
          <TypedText
            strings={[
              "My name is plastered everywhere here im sure you can figure it out, if not you can call me ish or ishy :3",
            ]}
            loop={false}
            whiteSpace={"normal"}
            typeSpeed={40}
          />
        </h1>
        <p
          className={clsx(
            "mt-4 max-w-4xl text-gray-700 dark:text-gray-200 md:mt-6",
            "md:text-lg 2xl:text-xl"
          )}
        ></p>
      </div>
      <WaveSVG />
      <div
        className="absolute inset-0 pointer-events-none z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.25,
          transition: "--now-playing-accent 1200ms ease-in-out",
        }}
      />
      <BackToTop elementRef={heroRef} />
    </section>
  );
};

export default Hero;
