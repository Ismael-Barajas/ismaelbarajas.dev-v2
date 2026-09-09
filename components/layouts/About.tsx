import { TypedText } from "components";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FiMapPin, FiBriefcase, FiLayers, FiMail } from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import { HiOutlineArrowDown } from "react-icons/hi";
import { Button } from "components/library/Button";
import { AnimatedBars } from "components/library/NowPlaying";
import useNowPlaying from "hooks/useNowPlaying";

const BIRTH_DATE = new Date(1997, 0, 30);

const getAge = () =>
  Math.floor(
    (Date.now() - BIRTH_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );

const FACTS = [
  { icon: FiMapPin, label: "Austin, TX" },
  { icon: LuGraduationCap, label: "CSU Fullerton" },
  { icon: FiBriefcase, label: "Saronic Technologies" },
  { icon: FiLayers, label: "Full stack" },
];

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.pushState(null, "", `#${id}`);
};

const About = () => {
  const [age, setAge] = useState(getAge);
  const { data: song } = useNowPlaying();
  // Only an actively playing track earns the line; paused and last-played
  // states show nothing here.
  const listening = song?.isPlaying && song.songUrl ? song : null;

  useEffect(() => {
    const interval = setInterval(() => setAge(getAge()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container min-h-screen-without-nav flex items-center">
      <div className="grid w-full items-center gap-12 py-16 md:grid-cols-[1.25fr_1fr] md:gap-16">
        <div className="order-2 space-y-6 md:order-1">
          <h2 className="font-display font-black text-text text-5xl">
            <TypedText
              className="animated-underline"
              strings={["About Me."]}
              loop={false}
              whiteSpace={"normal"}
            />
          </h2>
          <div className="space-y-4 text-lg text-text">
            <p>Hi! My name is Ismael Barajas.</p>
            <p>
              I&apos;m a {age} year old Software Engineer based in Austin, Texas
              with a B.S. in Computer Science from California State University,
              Fullerton.
            </p>
            <p>
              Full stack engineer. I build across the whole stack: UI, backend,
              and infrastructure. Some of my projects are linked below.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Quick facts">
            {FACTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1.5 text-sm text-gray-700 dark:bg-white/10 dark:text-gray-200"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          {/* div, not p: AnimatedBars renders block elements, which are
              invalid inside a paragraph and break hydration. */}
          {listening && (
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-flex [&>div]:w-auto">
                <AnimatedBars
                  color={listening.palette?.vibrant}
                  align="justify-start"
                />
              </span>
              <span>
                Right now I&apos;m listening to{" "}
                <a
                  href={listening.songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animated-underline font-medium text-text"
                >
                  {listening.title}
                </a>{" "}
                by {listening.artist}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("contact");
              }}
            >
              <FiMail className="h-4 w-4" aria-hidden="true" />
              Get in touch
            </Button>
            <Button
              variant="ghost"
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("projects");
              }}
            >
              See projects
              <HiOutlineArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <div className="relative h-80 w-72 overflow-hidden rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-transform duration-500 ease-out hover:-translate-y-1">
            <Image
              src="https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/ismaelbarajas.jpg"
              alt="Ismael Barajas"
              fill
              sizes="288px"
              loading="eager"
              className="object-cover"
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
