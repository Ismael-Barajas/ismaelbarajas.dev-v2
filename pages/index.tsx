import type { NextPage } from "next";

import { Metatags, TypedText } from "components";
import WaveSVG from "public/WaveSVG";

const Home: NextPage = () => {
  return (
    <>
      <Metatags />
      <section className="relative min-h-screen-without-nav items-center content-center flex pb-16 ">
        <div className="container">
          <p className="text-text text-5xl">
            <TypedText strings={["Hi!^750"]} loop={false} />
          </p>
        </div>
        <WaveSVG />
      </section>
      <section className="relative min-h-screen-without-nav items-center content-center flex pb-16 bg-roseDust">
        <div className="container">test</div>
      </section>
    </>
  );
};

export default Home;
