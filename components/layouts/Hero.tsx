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
        <h2 className="text-text text-2xl md:text-4xl 2xl:text-5xl">Hi!</h2>
        {/* <h1 className="text-text text-5xl text-center">
          <TypedText
            strings={[
              "Hi!^750",
              "My name is Ismael but you can call me ish or ishy!",
            ]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h1> */}
        <h1 className="text-text mt-1 text-3xl md:text-5xl 2xl:text-6xl">
          My name is{" "}
          <span className="animated-underline text-primary ">Ismael</span> but
          you can call me{" "}
          <TypedText
            strings={["ish^2000 or ishy! :3"]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h1>
        <p
          className={clsx(
            "mt-4 max-w-4xl text-gray-700 dark:text-gray-200 md:mt-6",
            "md:text-lg 2xl:text-xl"
          )}
        >
          {/* I work with React Ecosystem, and write to teach people how to rebuild
          and redefine fundamental concepts through mental models. */}
        </p>
      </div>
      <WaveSVG />
      <BackToTop elementRef={heroRef} />
    </section>
  );
};

export default Hero;
