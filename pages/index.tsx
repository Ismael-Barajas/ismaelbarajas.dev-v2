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
