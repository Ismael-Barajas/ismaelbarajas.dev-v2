import { TypedText, WaveSVG } from ".";

const Hero = () => {
  return (
    <section className="relative min-h-screen-without-nav items-center content-center flex pb-16 ">
      <div className="container">
        <h1 className="text-text text-5xl">
          <TypedText
            strings={["TEST TEXT TEST TEXXT STESTL HSDF SFSDF^750"]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h1>
      </div>
      <WaveSVG />
    </section>
  );
};

export default Hero;
