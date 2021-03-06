import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useWindowSize, useIsMounted } from "hooks";
import { ProgressBar, ToolTip, TypedText } from "..";
import { FiSun } from "react-icons/fi";
import { BsMoonStars } from "react-icons/bs";

const NavBar = () => {
  const navigationMobileRef = useRef<HTMLUListElement>(null);
  const mobileIconRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [onTop, setOnTop] = useState(true);
  const isMounted = useIsMounted();
  const router = useRouter();
  const { width } = useWindowSize();
  const { theme, setTheme } = useTheme();

  const toggleMobileNavigation = () => {
    navigationMobileRef.current?.classList.add("touched");
    navigationMobileRef.current?.classList.toggle("translate-x-full");
    setMobileNavOpen(!mobileNavOpen);
  };

  const handleScroll = () => {
    if (onTop !== (window.pageYOffset === 0)) {
      setOnTop(window.pageYOffset === 0);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

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
      "relative px-4 shadow-link ease-in-out hover:shadow-h-link transition-shadow duration-500 font-medium";
    const linkPage =
      "relative px-4 ease-in-out shadow-h-link transition-shadow duration-500 font-medium";
    const resetClasses =
      "relative px-4 shadow-link hover:shadow-h-link ease-in-out transition-shadow duration-500 font-medium";
    const listItemClasses = "my-2";
    return (
      <>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "about" }}>
            <a
              className={router.pathname != "/" ? resetClasses : linkClasses}
              onClick={linkClicked}
            >
              About
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "experience" }}>
            <a
              className={router.pathname != "/" ? resetClasses : linkClasses}
              onClick={linkClicked}
            >
              Experience
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "projects" }}>
            <a
              className={router.pathname != "/" ? resetClasses : linkClasses}
              onClick={linkClicked}
            >
              Projects
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/", hash: "contact" }}>
            <a
              className={router.pathname != "/" ? resetClasses : linkClasses}
              onClick={linkClicked}
            >
              Contact
            </a>
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link href={{ pathname: "/listen" }}>
            <a
              className={router.pathname === "/listen" ? linkPage : linkClasses}
              onClick={linkClicked}
            >
              Listen
            </a>
          </Link>
        </li>
        {/* <li className={listItemClasses}>
          <Link href="/cv">
            <a
              onClick={linkClicked}
              className={router.pathname === "/cv" ? linkPage : linkClasses}
            >
              CV
            </a>
          </Link>
        </li> */}
      </>
    );
  };

  return (
    <header>
      <nav
        className={`transition-all duration-700 ease-in-out fixed text-text bg-secondary-light dark:bg-secondary-dark/70 backdrop-blur-sm bg-opacity-70 h-16 w-full z-50 ${
          onTop ? "" : "shadow-card"
        }`}
      >
        <div className="flex h-full container justify-between items-center px-6 md:px-0">
          <a
            href="#about"
            className="absolute px-1 py-1 transition-transform duration-200 transform -translate-y-12 focus:translate-y-16 bg-secondary"
          >
            Skip to content
          </a>
          <Link passHref href={{ pathname: "/" }}>
            <a className="flex flex-row text-text text-lg lg:text-2xl w-[115px] font-medium">
              <TypedText
                strings={["Ismael Barajas"]}
                loop={false}
                whiteSpace={"pre"}
                className={"animated-underline"}
              />
            </a>
          </Link>
          <ul className="hidden md:flex md:gap-4 lg:gap-6">
            {renderNavigationItems()}
          </ul>
          <ul
            ref={navigationMobileRef}
            className={`md:hidden absolute flex flex-col w-full top-16 left-0 py-3 items-center text-white bg-primary transform translate-x-full gap-2 ${
              isMounted.current ? "transition-transform duration-300" : ""
            }`}
          >
            {renderNavigationItems()}
          </ul>
          <button
            aria-label="Toggle mobile menu"
            type="button"
            ref={mobileIconRef}
            onClick={toggleMobileNavigation}
            className="md:hidden order-3 cursor-pointer relative w-8 h-6"
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
          <ToolTip
            position="bottom"
            content={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            <button
              aria-label="Toggle Dark Mode"
              type="button"
              className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center order-2 md:order-3 absolute left-2/4 transform  duration-700 -translate-x-2/4 -translate-y-[18px] md:transform-none md:relative md:left-0 hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200 transition-all"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {isMounted.current && (
                <>
                  {theme === "dark" ? (
                    <FiSun className="w-5 h-5 text-blue-100" />
                  ) : (
                    <BsMoonStars className="w-5 h-5 text-blue-100" />
                  )}
                </>
              )}
            </button>
          </ToolTip>
        </div>
        <ProgressBar />
      </nav>
    </header>
  );
};

export default NavBar;
