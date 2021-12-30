import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useWindowSize, useIsMounted } from "hooks";
import { TypedText } from ".";

const NavBar = () => {
  const navigationMobileRef = useRef<HTMLUListElement>(null);
  const mobileIconRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMounted = useIsMounted();
  const router = useRouter();
  const { width } = useWindowSize();
  const { theme, setTheme } = useTheme();

  const toggleMobileNavigation = () => {
    navigationMobileRef.current?.classList.add("touched");
    navigationMobileRef.current?.classList.toggle("translate-x-full");
    setMobileNavOpen(!mobileNavOpen);
  };

  const linkClicked = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (event.currentTarget.href.indexOf("cv") > -1) {
      document.querySelectorAll("nav li a").forEach((navEl) => {
        navEl.classList.remove("active");
      });
    }
    if (width! <= 768) {
      toggleMobileNavigation();
    }
  };

  const renderNavigationItems = () => {
    const linkClasses =
      "relative before:absolute before:bottom-[-5px] before:h-[5px] before:w-[0] before:mt-[5px] py-2 px-4 rounded-sm ring-offset-indigo-100 dark:ring-gray-200 hover:ring-2 before:bg-primary before:transition-all before:duration-300";
    const listItemClasses = "my-2";
    return (
      <>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "about" }}>
            <a className={linkClasses} onClick={linkClicked}>
              About
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "experience" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Experience
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "projects" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Projects
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "contact" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Contact
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href="/cv">
            <a
              onClick={linkClicked}
              className={`${linkClasses} ${
                router.pathname === "/cv" ? "active" : ""
              }`}
            >
              CV
            </a>
          </Link>
        </li>
      </>
    );
  };

  return (
    <>
      <nav className="fixed text-text bg-secondary bg-opacity-60 h-16 w-full z-50">
        <div className="flex h-full container mx-auto justify-between items-center px-6 md:px-0">
          <a
            href="#about"
            className="absolute px-2 py-3 transition-transform duration-200 transform -translate-y-12 focus:translate-y-16"
          >
            Skip to content
          </a>
          <Link passHref href={{ pathname: "/" }}>
            <a className="flex flex-row text-text text-lg lg:text-2xl w-[115px]">
              <TypedText
                strings={["Ismael Barajas"]}
                loop={false}
                whiteSpace={"pre"}
              />
            </a>
          </Link>
          <ul className="hidden md:flex md:gap-6">{renderNavigationItems()}</ul>
          <ul
            ref={navigationMobileRef}
            className={`md:hidden absolute flex flex-col w-full top-16 left-0 py-3 items-center text-white bg-primary transform translate-x-full gap-2 ${
              isMounted.current ? "transition-transform" : ""
            }`}
          >
            {renderNavigationItems()}
          </ul>
          <button
            aria-label="Toggle mobile menu"
            type="button"
            ref={mobileIconRef}
            onClick={toggleMobileNavigation}
            className="md:hidden order-3 cursor-pointer relative w-5 h-6"
          >
            <span
              className={`transform transition-transform duration-300 absolute h-1 w-full bg-primary rounded-lg left-0 top-1 ${
                mobileNavOpen ? "rotate-135 top-3" : "rotate-0"
              }`}
            ></span>
            <span
              className={`absolute transition-opacity duration-300 h-1 w-full bg-primary rounded-lg left-0 top-3 ${
                mobileNavOpen ? "opacity-0 " : "opacity-100"
              }`}
            ></span>
            <span
              className={`transform transition-transform duration-300 absolute h-1 w-full bg-primary rounded-lg left-0 ${
                mobileNavOpen ? "-rotate-135 top-3" : "rotate-0 top-5"
              }`}
            ></span>
          </button>
          <button
            aria-label="Toggle Dark Mode"
            type="button"
            className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center order-2 md:order-3 absolute left-2/4 transform -translate-x-2/4 lg:transform-none md:relative md:left-0 hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200 transition-all "
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {isMounted.current && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-5 h-5 text-blue-100"
              >
                {theme === "dark" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                )}
              </svg>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
