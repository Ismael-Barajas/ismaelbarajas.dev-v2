import { MutableRefObject, useEffect, useState } from "react";
import { ChevronDoubleUpIcon } from "@heroicons/react/outline";

interface Props {
  elementRef: MutableRefObject<Element>;
}

const BackToTop = ({ elementRef }: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver;
    const options = {
      threshold: 0.3,
    };
    if (elementRef.current) {
      observer = new IntersectionObserver((entries) => {
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

  return (
    <button
      onClick={scrollUp}
      className={`${
        isVisible ? "translate-x-0" : "translate-x-16"
      } bg-primary hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200 transition-all ease-in-out rounded-full fixed bottom-0 right-0 mb-3 mr-3 duration-700 transform shadow-card p-[6px] z-50`}
    >
      <ChevronDoubleUpIcon className="text-[#cef9ff] h-9 w-9" />
    </button>
  );
};

export default BackToTop;
