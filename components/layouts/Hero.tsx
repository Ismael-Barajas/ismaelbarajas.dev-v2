import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { BackToTop, WaveSVG } from "..";
import DecryptedText from "../library/DecryptedText";

const Antigravity = dynamic(() => import("../library/Antigravity"), {
  ssr: false,
});

const Hero = () => {
  const heroRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const [accentColor, setAccentColor] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue("--now-playing-accent")
        .trim();
      const isTransparent =
        !val ||
        val === "transparent" ||
        /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(val);
      setAccentColor(isTransparent ? null : val);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => observer.disconnect();
  }, []);

  const particleColor =
    accentColor || (resolvedTheme === "dark" ? "#888888" : "#444444");

  return (
    <section
      id="hero"
      ref={heroRef}
      className="transition-[background-color] duration-700 ease-in-out relative min-h-screen-without-nav items-center content-center flex pb-44 "
    >
      <div className="container relative z-10">
        <h1 className="font-black text-text text-5xl md:text-7xl 2xl:text-8xl leading-none tracking-tight">
          <DecryptedText
            text="Ismael Barajas"
            animateOn="view"
            sequential
            revealDirection="start"
            speed={110}
            encryptedClassName="opacity-20"
          />
        </h1>
        <h2 className="mt-3 text-lg md:text-xl 2xl:text-2xl font-medium tracking-[0.25em] uppercase text-gray-500 dark:text-gray-400">
          <DecryptedText
            text="Software Engineer"
            animateOn="view"
            sequential
            revealDirection="start"
            speed={110}
            encryptedClassName="opacity-20"
          />
        </h2>
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Antigravity
          count={3000}
          magnetRadius={6}
          ringRadius={13}
          waveSpeed={0.8}
          waveAmplitude={0.8}
          particleSize={1}
          lerpSpeed={0.1}
          color={particleColor}
          autoAnimate={true}
          particleVariance={1.4}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="sphere"
          fieldStrength={2}
        />
      </div>
      <WaveSVG />
      <div
        className="absolute inset-0 pointer-events-none z-5"
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
