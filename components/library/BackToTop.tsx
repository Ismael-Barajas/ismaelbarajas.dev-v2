import { MutableRefObject, useEffect, useState } from "react";

interface Props {
  elementRef: MutableRefObject<null>;
}

const BackToTop = ({ elementRef }: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver;
    const options = {
      threshold: 0.3,
    };
    if (elementRef.current) {
      observer = new IntersectionObserver((entries, observer) => {
        entries[0].isIntersecting ? setIsVisible(false) : setIsVisible(true);
      }, options);
      observer.observe(elementRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  const scrollUp = () => {
    document.body.scrollIntoView({ behavior: "smooth" });
  };

  console.log(isVisible);
  return (
    <button
      onClick={scrollUp}
      className={`${
        !isVisible && "hidden"
      } bg-primary hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200 transition-all text-white fixed bottom-0 right-0 mb-3 mr-3 duration-700  transform  md:transform-none `}
    >
      Top
    </button>
  );
};

export default BackToTop;
