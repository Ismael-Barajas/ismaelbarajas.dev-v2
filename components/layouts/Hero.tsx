import { useRef } from "react";
import { BackToTop, TypedText, WaveSVG } from "..";

const Hero = () => {
  const heroRef = useRef(null);
  return (
    <section
      id="hero"
      ref={heroRef}
      className="transition-[background-color] duration-700 ease-in-out relative min-h-screen-without-nav items-center content-center flex pb-16 "
    >
      <div className="container">
        <h1 className="text-text text-5xl text-center">
          <TypedText
            strings={[
              "Hi!^750",
              "Site is still being worked on so some stuff might be broken/missing oops :3",
            ]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h1>
      </div>
      <WaveSVG />
      <BackToTop elementRef={heroRef} />
    </section>
  );
};

export default Hero;
