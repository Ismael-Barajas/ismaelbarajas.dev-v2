import type { NextPage } from "next";
import {
  About,
  Contact,
  Experience,
  Hero,
  Metatags,
  Projects,
} from "components";

const Home: NextPage = () => {
  return (
    <>
      <Metatags />
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Contact />
    </>
  );
};

export default Home;
