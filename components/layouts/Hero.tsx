import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackToTop, WaveSVG } from "..";
import DecryptedText from "../library/DecryptedText";

const Dither = dynamic(() => import("../library/Dither"), {
  ssr: false,
});

function parseColor(color: string): [number, number, number] {
  const hex = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex) {
    return [
      parseInt(hex[1], 16) / 255,
      parseInt(hex[2], 16) / 255,
      parseInt(hex[3], 16) / 255,
    ];
  }
  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgb) {
    return [
      parseInt(rgb[1]) / 255,
      parseInt(rgb[2]) / 255,
      parseInt(rgb[3]) / 255,
    ];
  }
  return [0.533, 0.533, 0.533];
}

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

  const waveColor = useMemo<[number, number, number]>(() => {
    const hex =
      accentColor || (resolvedTheme === "dark" ? "#888888" : "#444444");
    return parseColor(hex);
  }, [accentColor, resolvedTheme]);

  const backgroundColor = useMemo<[number, number, number]>(() => {
    return parseColor(resolvedTheme === "dark" ? "#121212" : "#E0E0E0");
  }, [resolvedTheme]);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="transition-[background-color] duration-700 ease-in-out relative min-h-screen-without-nav items-center content-center flex pb-44 "
    >
      <div className="container relative z-10 pointer-events-none">
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
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={waveColor}
          backgroundColor={backgroundColor}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.1}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
      <WaveSVG />
      <BackToTop elementRef={heroRef} />
    </section>
  );
};

export default Hero;
