import { calculateAge } from "lib/age";
import { useEffect, useState } from "react";

const CV = () => {
  const [age, setAge] = useState("");

  useEffect(() => {
    const ageInterval = setInterval(() => {
      setAge(calculateAge());
    }, 50);
    return () => clearInterval(ageInterval);
  }, []);

  return (
    <div className="text-text text-center py-12">
      <p>{age}</p>
    </div>
  );
};

export default CV;
