import { TypedText } from "components";
import { useEffect, useState } from "react";
import Image from "next/image";

const BIRTH_DATE = new Date(1997, 0, 30);

const getAge = () =>
  Math.floor(
    (Date.now() - BIRTH_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );

const About = () => {
  const [age, setAge] = useState(getAge);

  useEffect(() => {
    const interval = setInterval(() => setAge(getAge()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container min-h-screen-without-nav flex items-center">
      <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full py-16">
        <div className="space-y-6 order-2 md:order-1">
          <h2 className="font-black text-text text-5xl">
            <TypedText
              className="animated-underline"
              strings={["About Me."]}
              loop={false}
              whiteSpace={"normal"}
            />
          </h2>
          <div className="space-y-4 text-text text-lg">
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
            <p>
              Feel free to reach out through any of the platforms{" "}
              <a
                href="#contact"
                className="shadow-link ease-in-out hover:shadow-h-link transition-shadow duration-500"
              >
                below
              </a>
              . Always happy to connect about a project or opportunity!
            </p>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl border-2 border-text/20 translate-x-4 translate-y-4" />
            <div className="relative w-72 h-80 rounded-3xl overflow-hidden">
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
    </div>
  );
};

export default About;
