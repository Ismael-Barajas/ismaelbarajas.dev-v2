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
import smoothscroll from "smoothscroll-polyfill";

const Home: NextPage = () => {
  const aboutRef = useRef(null);
  const experienceRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    smoothscroll.polyfill();
  }, []);

  useEffect(() => {
    var barTimeout: NodeJS.Timeout;
    document.body.onscroll = () => {
      if (barTimeout) {
        clearTimeout(barTimeout);
      }
      barTimeout = setTimeout(() => {
        document.body.classList.remove("scrolling");
      }, 700);
      document.body.classList.add("scrolling");
    };
  }, []);

  useEffect(() => {
    let observer: IntersectionObserver;
    if (
      aboutRef.current &&
      experienceRef.current &&
      contactRef.current &&
      projectsRef.current
    ) {
      const options = {
        threshold: 0.2,
      };
      observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          const navElement = document.querySelector(
            `a[href="/#${entry.target.id}"]`
          );
          if (
            entry.isIntersecting &&
            !navElement?.classList.contains("shadow-h-link")
          ) {
            navElement?.classList.add("shadow-h-link");
            navElement?.classList.remove("shadow-link");
          } else if (
            !entry.isIntersecting &&
            navElement?.classList.contains("shadow-h-link")
          ) {
            navElement.classList.remove("shadow-h-link");
            navElement.classList.add("shadow-link");
          }
        });
      }, options);
      observer.observe(aboutRef.current);
      observer.observe(experienceRef.current);
      observer.observe(contactRef.current);
      observer.observe(projectsRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [aboutRef, experienceRef, contactRef, projectsRef]);

  return (
    <>
      <Metatags />
      <Hero />
      <section
        id="about"
        className="transition-[background-color] duration-700 ease-in-out bg-secondary"
        ref={aboutRef}
      >
        <About />
      </section>
      <section id="experience" ref={experienceRef}>
        <Experience />
      </section>
      <section
        id="projects"
        className="transition-[background-color] duration-700 ease-in-out bg-secondary"
        ref={projectsRef}
      >
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
