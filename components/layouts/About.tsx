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
      <h2 className="font-bold text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["About Me."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      <div className="text-text text-center pb-12 text-xl">
        <Image
          src="/images/ismaelbarajas.jpg"
          alt="Rounded Avatar"
          width={240}
          height={240}
          objectFit="cover"
          className="rounded-full"
          quality={100}
        />
        <p>Hi! My name is Ismael Barajas.</p>
        <br />
        <p>
          I&apos;m a {age} year old recent graduate from California State
          University, Fullerton with a B.S. in Computer Science. When I&apos;m
          not coding, I enjoy playing video games (an unhealthy amount of
          Valorant) and building/collecting{" "}
          <ToolTip position="bottom" content={"Coming soon!"}>
            <a className="shadow-link ease-in-out hover:shadow-h-link transition-shadow duration-500">
              keyboards.
            </a>
          </ToolTip>
        </p>
        <br />
        <p>
          As of late I&apos;ve taken an interest in Front End developing with
          React also into Back End development. You can check out some of the
          projects I have worked on below! I would say I&apos;m most proficient
          with React, JavaScript/JSX, Python, and C++. I&apos;m also familiar
          with other languages as well, such as C. I wouldn&apos;t consider
          myself a Front End Developer just yet because it&apos;s very early in
          my career and interests change over time. So who knows what other
          projects, languages, and career opportunities await!
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
