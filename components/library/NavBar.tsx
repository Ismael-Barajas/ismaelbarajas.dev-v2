import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useTheme from "hooks/useTheme";
import { useWindowSize, useIsMounted } from "hooks";
import { ProgressBar, ToolTip } from "..";
import BrandSwap from "components/compressions/BrandSwap";
import { FiSun } from "react-icons/fi";
import { BsMoonStars } from "react-icons/bs";

const NavBar = () => {
  const navigationMobileRef = useRef<HTMLUListElement>(null);
  const mobileIconRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [onTop, setOnTop] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const isMounted = useIsMounted();
  const router = useRouter();
  const { width } = useWindowSize();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleMobileNavigation = () => {
    navigationMobileRef.current?.classList.add("touched");
    navigationMobileRef.current?.classList.toggle("translate-x-full");
    setMobileNavOpen(!mobileNavOpen);
  };

  useEffect(() => {
    const sections = ["about", "experience", "projects", "contact"];
    const handleSectionScroll = () => {
      const mid = window.innerHeight / 2;
      let current = "";
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= mid && bottom >= mid) current = id;
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleSectionScroll, { passive: true });
    handleSectionScroll();
    return () => window.removeEventListener("scroll", handleSectionScroll);
  }, []);

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
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    const href = event.currentTarget.getAttribute("href") ?? "";
    const hash = href.includes("#") ? href.split("#")[1] : null;
    if (hash) {
      event.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
    if (width! <= 768) {
      toggleMobileNavigation();
    }
  };

  const smoothScrollTo = (targetY: number, duration = 600) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (diff === 0) return;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quint — fast start, gentle deceleration
      const ease = 1 - Math.pow(1 - progress, 4);

      window.scrollTo(0, startY + diff * ease);

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const renderNavigationItems = () => {
    const linkClasses =
      "relative px-4 shadow-link ease-in-out hover:shadow-h-link hover:text-[#E0E0E0] transition-[box-shadow,color] duration-300 font-medium";
    const linkPage =
      "relative px-4 ease-in-out shadow-h-link transition-[box-shadow,color] duration-300 font-medium";
    const resetClasses =
      "relative px-4 shadow-link hover:shadow-h-link hover:text-[#E0E0E0] ease-in-out transition-[box-shadow,color] duration-300 font-medium";
    const listItemClasses = "my-2";
    return (
      <>
        {[
          { hash: "about", label: "About" },
          { hash: "experience", label: "Experience" },
          { hash: "projects", label: "Projects" },
          { hash: "contact", label: "Contact" },
        ].map(({ hash, label }) => {
          const isActive = router.pathname === "/" && activeSection === hash;
          return (
            <li key={hash} className={listItemClasses}>
              {router.pathname === "/" ? (
                <a
                  href={`#${hash}`}
                  className={isActive ? linkPage : linkClasses}
                  style={isActive ? { color: "#E0E0E0" } : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(hash);
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 64;
                      smoothScrollTo(top);
                    }
                    window.history.pushState(null, "", `#${hash}`);
                    if (width! <= 768) toggleMobileNavigation();
                  }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  href={{ pathname: "/", hash }}
                  className={resetClasses}
                  onClick={() => { if (width! <= 768) toggleMobileNavigation(); }}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
        <li className={listItemClasses}>
          <Link
            href={{ pathname: "/listen" }}
            className={router.pathname === "/listen" ? linkPage : linkClasses}
            style={router.pathname === "/listen" ? { color: "#E0E0E0" } : undefined}
            onClick={linkClicked}
          >
            Listen
          </Link>
        </li>
        <li className={listItemClasses}>
          <Link
            href={{ pathname: "/compressions" }}
            className={router.pathname === "/compressions" ? linkPage : linkClasses}
            style={router.pathname === "/compressions" ? { color: "#E0E0E0" } : undefined}
            onClick={linkClicked}
          >
            Compressions
          </Link>
        </li>
      </>
    );
  };

  return (
    <header>
      <nav
        data-route={router.pathname === "/compressions" ? "compressions" : undefined}
        className={`transition-[background-color,color,box-shadow] duration-700 ease-in-out fixed text-text bg-linear-to-b from-secondary-light/90 to-secondary-light/40 dark:from-secondary-dark/90 dark:to-secondary-dark/40 backdrop-blur-md h-16 w-full z-50 ${
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
          <Link
            href={{ pathname: "/" }}
            className="inline-block text-text text-lg lg:text-2xl font-medium min-w-[11ch]"
          >
            <BrandSwap key={router.pathname === "/compressions" ? "c" : "n"} />
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
            content={resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            <button
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              type="button"
              className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center order-2 md:order-3 cursor-pointer focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text transition-all duration-700"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {isMounted.current && (
                resolvedTheme === "dark" ? (
                  <FiSun className="w-5 h-5 text-blue-100" />
                ) : (
                  <BsMoonStars className="w-5 h-5 text-blue-100" />
                )
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
