import { useEffect, useRef } from "react";
import type { NextPage } from "next";
import {
  About,
  Contact,
  Experience,
  Footer,
  Hero,
  Metatags,
  Projects,
} from "components";
const Home: NextPage = () => {
  const aboutRef = useRef(null);
  const experienceRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    let barTimeout: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (barTimeout) clearTimeout(barTimeout);
      barTimeout = setTimeout(() => {
        document.body.classList.remove("scrolling");
      }, 700);
      document.body.classList.add("scrolling");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (barTimeout) clearTimeout(barTimeout);
      document.body.classList.remove("scrolling");
    };
  }, []);

  return (
    <>
      <Metatags />
      <Hero />
      <section id="about" ref={aboutRef}>
        <About />
      </section>
      <section id="experience" ref={experienceRef}>
        <Experience />
      </section>
      <section id="projects" ref={projectsRef}>
        <Projects />
      </section>
      <section id="contact" ref={contactRef}>
        <Contact />
      </section>
      <Footer />
    </>
  );
};

export default Home;
