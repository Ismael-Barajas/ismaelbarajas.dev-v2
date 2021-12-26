import type { NextPage } from "next";
import { Hero, Metatags } from "components";

const Home: NextPage = () => {
  return (
    <>
      <Metatags />
      <Hero />
      <section className="relative min-h-screen-without-nav items-center content-center flex pb-16 bg-secondary">
        <div className="container">test</div>
      </section>
      <section className="relative min-h-screen-without-nav items-center content-center flex pb-16 ">
        <div className="container">test</div>
      </section>
    </>
  );
};

export default Home;
