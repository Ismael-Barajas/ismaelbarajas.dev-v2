import { calculateAge } from "lib/age";
import { useEffect, useState } from "react";

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
      <p className="text-text text-center pt-56 text-4xl">
        I&apos;m currently <b>{age}</b> years old
      </p>
    </div>
  );
};

export default About;
