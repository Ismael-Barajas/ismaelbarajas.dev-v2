import { TypedText } from "components";
import { calculateAge } from "lib/age";
import { useEffect, useState } from "react";
import { ToolTip } from "..";
import Image from "next/image";

const About = () => {
  const [age, setAge] = useState("");

  useEffect(() => {
    const ageInterval = setInterval(() => {
      setAge(calculateAge());
    }, 50);
    return () => clearInterval(ageInterval);
  }, []);

  return (
    <div className="container min-h-screen-without-nav">
      <h2 className="font-black text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["About Me."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      <div className="text-text text-center pb-12 text-xl">
        <div className="flex justify-center mb-6">
          <div className="relative w-60 h-60 rounded-full overflow-hidden">
            <Image
              src="https://vsgkt473qeluf9ed.public.blob.vercel-storage.com/images/ismaelbarajas.jpg"
              alt="Rounded Avatar"
              fill
              sizes="240px"
              loading="eager"
              className="object-cover"
              quality={100}
            />
          </div>
        </div>
        <p>Hi! My name is Ismael Barajas.</p>
        <br />
        <p>
          I&apos;m a {age} year old Software Engineer based in Austin, Texas
          with a B.S. in Computer Science from California State University,
          Fullerton. When I&apos;m not coding, I enjoy playing video games and
          still have a collection of{" "}
          <ToolTip position="bottom" content={"Coming soon!"}>
            <a className="shadow-link ease-in-out hover:shadow-h-link transition-shadow duration-500">
              keyboards
            </a>
          </ToolTip>{" "}
          I&apos;ve built over the years.
        </p>
        <br />
        <p>
          I work as a full stack engineer, building and shipping products across
          the entire stack — from React and TypeScript on the front end to APIs,
          databases, and cloud infrastructure on the back end. You can check out
          some of the projects I&apos;ve worked on below!
        </p>
        <br />
        <p>
          Feel free to contact me anytime through any of the platforms{" "}
          <a
            href="#contact"
            className="shadow-link ease-in-out hover:shadow-h-link transition-shadow duration-500"
          >
            below
          </a>
          !
        </p>
        <br />
        <p>Thanks for stopping by!</p>
      </div>
    </div>
  );
};

export default About;
