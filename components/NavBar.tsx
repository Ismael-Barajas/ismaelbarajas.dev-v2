import React, { ChangeEventHandler, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import useWindowSize from "../hooks/useWindowSize";
import useIsMounted from "../hooks/useIsMounted";

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
      "relative before:absolute before:bottom-[-5px] before:h-[5px] before:w-[0] before:mt-[5px] before:bg-primary before:transition-all before:duration-300";
    return (
      <>
        <li>
          <Link href={{ pathname: "/", hash: "personal" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Personal
            </a>
          </Link>
        </li>
        <li>
          <Link href={{ pathname: "/", hash: "portfolio" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Portfolio
            </a>
          </Link>
        </li>
        <li>
          <Link href={{ pathname: "/", hash: "blog" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Blog
            </a>
          </Link>
        </li>
        <li>
          <Link href={{ pathname: "/", hash: "stats" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Stats
            </a>
          </Link>
        </li>
        <li>
          <Link href={{ pathname: "/", hash: "contact" }}>
            <a className={linkClasses} onClick={linkClicked}>
              Contact
            </a>
          </Link>
        </li>
        <li>
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
    <nav className="fixed text-gray-900 bg-gray-50 dark:bg-gray-900 bg-opacity-60 dark:text-gray-100  h-16 w-full z-50">
      <div className="flex h-full container mx-auto justify-between items-center px-6 md:px-0">
        <Link passHref href={{ pathname: "/" }}>
          <a className=" flex flex-row text-lg lg:text-2xl">Ismael Barajas</a>
        </Link>
        <ul className="hidden md:flex md:gap-6">{renderNavigationItems()}</ul>
        <ul
          ref={navigationMobileRef}
          className={`md:hidden absolute flex flex-col w-full top-16 left-0 py-3 items-center text-white bg-pink-300 transform translate-x-full gap-2 ${
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
            className={`transform transition-transform duration-300 absolute h-1 w-full bg-pink-300 rounded-lg left-0 top-1 ${
              mobileNavOpen ? "rotate-135 top-3" : "rotate-0"
            }`}
          ></span>
          <span
            className={`absolute transition-opacity duration-300 h-1 w-full bg-pink-300 rounded-lg left-0 top-3 ${
              mobileNavOpen ? "opacity-0 " : "opacity-100"
            }`}
          ></span>
          <span
            className={`transform transition-transform duration-300 absolute h-1 w-full bg-pink-300 rounded-lg left-0 ${
              mobileNavOpen ? "-rotate-135 top-3" : "rotate-0 top-5"
            }`}
          ></span>
        </button>
        {/* <button
          aria-label="Toggle Dark Mode"
          type="button"
          className="p-3 h-12 w-12 order-2 md:order-3 absolute left-2/4 transform -translate-x-2/4 lg:transform-none md:relative md:left-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isMounted.current && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              className="h-6 w-6 text-gray-800 dark:text-gray-200"
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
        </button> */}
        <button
          aria-label="Toggle Dark Mode"
          type="button"
          className="w-9 h-9 bg-gray-200 rounded-lg dark:bg-gray-600 flex items-center justify-center order-2 md:order-3 absolute left-2/4 transform -translate-x-2/4 lg:transform-none md:relative md:left-0 hover:ring-2 ring-gray-300 transition-all "
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isMounted.current && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5 text-gray-800 dark:text-gray-200"
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
  );
};

export default NavBar;
