import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  useWindowSize,
  useIsMounted,
  useScrollProgress,
  useNowPlayingAccent,
} from "hooks";
import { ProgressBar } from "..";
import BrandSwap from "components/compressions/BrandSwap";
import ThemeToggle, { type ToggleStyle } from "./ThemeToggle";
import CollapsingBrand from "./CollapsingBrand";

/**
 * Navigation style. Flip this to compare.
 *  - "classic": the original full-width bar with per-link underlines.
 *  - "pill":    a floating frosted pill with one sliding highlight and the
 *               scroll progress along its bottom edge.
 *  - "minimal": full-width bar, muted links, one sliding accent underline,
 *               and the name collapses to a monogram once you scroll.
 */
type NavStyle = "classic" | "pill" | "minimal";
const NAV_STYLE = "minimal" as NavStyle;

/**
 * Theme toggle look for the pill and minimal styles. Classic keeps its own.
 *  - "ghost":   bare icon, no background.
 *  - "frosted": translucent circle.
 */
const TOGGLE_STYLE = "ghost" as ToggleStyle;

/** Base width the minimal underline is scaled from (keeps it compositor-only). */
const INDICATOR_BASE = 100;
const INDICATOR_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const SECTIONS = [
  { hash: "about", label: "About" },
  { hash: "experience", label: "Experience" },
  { hash: "projects", label: "Projects" },
  { hash: "contact", label: "Contact" },
];

const PAGES = [
  { pathname: "/listen", label: "Listen" },
  { pathname: "/compressions", label: "Compressions" },
];

interface NavItem {
  key: string;
  label: string;
  isActive: boolean;
  /** Plain anchor for same-page section jumps; Next Link otherwise. */
  href: string | { pathname: string; hash?: string };
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

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

const NavBar = () => {
  const navigationMobileRef = useRef<HTMLUListElement>(null);
  const mobileIconRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [onTop, setOnTop] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  // Set on click so the indicator moves immediately; cleared shortly after,
  // once scroll tracking or the route has caught up.
  const [override, setOverride] = useState<string | null>(null);
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pause section tracking while a click-triggered smooth scroll is running,
  // so the indicator doesn't hop through the sections it passes.
  const scrollLockUntil = useRef(0);
  // Sliding active indicator for the pill and minimal styles. Positioned by
  // writing a transform straight to the element so the move runs on the
  // compositor and survives the main-thread stall of a heavy page mount.
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const indicatorReady = useRef(false);
  const isMounted = useIsMounted();
  const router = useRouter();
  const { width } = useWindowSize();
  const scrollProgress = useScrollProgress();
  const accent = useNowPlayingAccent();

  const toggleMobileNavigation = () => {
    navigationMobileRef.current?.classList.add("touched");
    navigationMobileRef.current?.classList.toggle("translate-x-full");
    setMobileNavOpen(!mobileNavOpen);
  };

  useEffect(() => {
    const sections = SECTIONS.map((s) => s.hash);
    const handleSectionScroll = () => {
      if (Date.now() < scrollLockUntil.current) return;
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

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleMobileNavigation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const closeMobileIfNeeded = () => {
    if (width! <= 768) toggleMobileNavigation();
  };

  const isHome = router.pathname === "/";

  const computedActiveKey = isHome
    ? activeSection
    : (PAGES.find((p) => p.pathname === router.pathname)?.pathname ?? "");
  const activeKey = override ?? computedActiveKey;

  useEffect(() => {
    if (NAV_STYLE === "classic") return;
    const list = listRef.current;
    const ind = indicatorRef.current;
    if (!list || !ind) return;

    const apply = () => {
      const active = list.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) {
        ind.style.opacity = "0";
        return;
      }
      // Measure against the list, not the link's own <li>.
      const listBox = list.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      const x = box.left - listBox.left;
      const w = box.width;
      const firstPaint = !indicatorReady.current;
      const savedTransition = ind.style.transition;
      if (firstPaint) ind.style.transition = "none";
      if (NAV_STYLE === "minimal") {
        const inset = 12; // matches the link's px-3
        ind.style.transform = `translateX(${x + inset}px) scaleX(${
          (w - inset * 2) / INDICATOR_BASE
        })`;
      } else {
        ind.style.transform = `translateX(${x}px)`;
        ind.style.width = `${w}px`;
      }
      ind.style.opacity = "1";
      if (firstPaint) {
        void ind.offsetWidth; // flush so the next change animates
        ind.style.transition = savedTransition;
        indicatorReady.current = true;
      }
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [activeKey]);

  const applyOverride = (key: string) => {
    setOverride(key);
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
    overrideTimer.current = setTimeout(() => setOverride(null), 900);
  };

  const navItems: NavItem[] = [
    ...SECTIONS.map(({ hash, label }) => ({
      key: hash,
      label,
      isActive: activeKey === hash,
      href: isHome ? `#${hash}` : { pathname: "/", hash },
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        applyOverride(hash);
        if (isHome) {
          e.preventDefault();
          scrollLockUntil.current = Date.now() + 750;
          const el = document.getElementById(hash);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 64;
            smoothScrollTo(top);
          }
          window.history.pushState(null, "", `#${hash}`);
        }
        closeMobileIfNeeded();
      },
    })),
    ...PAGES.map(({ pathname, label }) => ({
      key: pathname,
      label,
      isActive: activeKey === pathname,
      href: { pathname },
      onClick: () => {
        applyOverride(pathname);
        closeMobileIfNeeded();
      },
    })),
  ];

  /**
   * Always a Next Link, even for same-page hash jumps, so the element keeps
   * its identity across route changes and the sliding indicator can animate
   * between links instead of remounting.
   */
  const renderAnchor = (
    item: NavItem,
    className: string,
    style?: React.CSSProperties,
    children?: React.ReactNode,
  ) => (
    <Link
      href={item.href}
      className={className}
      style={style}
      onClick={item.onClick}
      scroll={typeof item.href !== "string"}
      data-active={item.isActive ? "true" : "false"}
    >
      {children ?? item.label}
    </Link>
  );

  // ---------------------------------------------------------------------
  // Classic link styling (unchanged from the original bar)
  // ---------------------------------------------------------------------
  const renderClassicItems = () => {
    const linkClasses =
      "relative px-4 shadow-link ease-in-out hover:shadow-h-link hover:text-[#E0E0E0] transition-[box-shadow,color] duration-300 font-medium";
    const linkPage =
      "relative px-4 ease-in-out shadow-h-link transition-[box-shadow,color] duration-300 font-medium";
    return navItems.map((item) => (
      <li key={item.key} className="my-2">
        {renderAnchor(
          item,
          item.isActive ? linkPage : linkClasses,
          item.isActive ? { color: "#E0E0E0" } : undefined,
        )}
      </li>
    ));
  };

  // ---------------------------------------------------------------------
  // Pill: soft filled highlight slides between links
  // ---------------------------------------------------------------------
  const renderPillItems = () =>
    navItems.map((item) => (
      <li key={item.key} className="relative">
        {renderAnchor(
          item,
          `relative block rounded-full px-3 py-1.5 text-sm transition-colors duration-300 ${
            item.isActive
              ? "text-text"
              : "text-gray-600 hover:text-text dark:text-gray-300"
          }`,
        )}
      </li>
    ));

  const pillIndicator = (
    <span
      ref={indicatorRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-black/10 opacity-0 will-change-transform dark:bg-white/15"
      style={{
        transition: `transform 500ms ${INDICATOR_EASE}, width 500ms ${INDICATOR_EASE}, opacity 300ms ease`,
      }}
    />
  );

  // ---------------------------------------------------------------------
  // Minimal: muted links, one glowing accent underline slides
  // ---------------------------------------------------------------------
  const renderMinimalItems = () =>
    navItems.map((item) => (
      <li key={item.key} className="relative">
        {renderAnchor(
          item,
          `relative block px-3 py-2 text-sm transition-colors duration-300 ${
            item.isActive
              ? "text-text"
              : "text-gray-500 hover:text-text dark:text-gray-400"
          }`,
        )}
      </li>
    ));

  const minimalIndicator = (
    <span
      ref={indicatorRef}
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 origin-left rounded-full opacity-0 will-change-transform"
      style={{
        width: INDICATOR_BASE,
        backgroundColor: accent ?? "var(--text)",
        boxShadow: accent ? `0 0 12px ${accent}` : undefined,
        transition: `transform 500ms ${INDICATOR_EASE}, opacity 300ms ease, background-color 700ms ease`,
      }}
    />
  );

  // Classic keeps the original three-bar button and slide-in list.
  const classicMenuButton = (
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
  );

  // Modern (pill + minimal): two thin lines that fold into an X, on the same
  // surface as the theme toggle.
  const menuSurface =
    TOGGLE_STYLE === "ghost"
      ? "rounded-lg text-gray-500 hover:text-text dark:text-gray-400 dark:hover:text-text"
      : "rounded-full bg-black/[0.08] text-text hover:bg-black/[0.14] dark:bg-white/10 dark:hover:bg-white/[0.16]";
  const lineBase =
    "absolute h-0.5 w-[18px] rounded-full bg-current transition-[translate,rotate] duration-300 ease-out";
  const modernMenuButton = (
    <button
      type="button"
      aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
      aria-expanded={mobileNavOpen}
      aria-controls="mobile-menu"
      onClick={toggleMobileNavigation}
      className={`relative order-3 flex h-9 w-9 cursor-pointer items-center justify-center transition-colors duration-500 focus-visible:ring-2 ring-offset-2 ring-offset-background ring-text md:hidden ${menuSurface}`}
    >
      <span
        className={`${lineBase} ${
          mobileNavOpen ? "translate-y-0 rotate-45" : "-translate-y-[3px]"
        }`}
      />
      <span
        className={`${lineBase} ${
          mobileNavOpen ? "translate-y-0 -rotate-45" : "translate-y-[3px]"
        }`}
      />
    </button>
  );

  // Frosted dropdown that fades down; links stagger in behind it.
  const modernMobileMenu = (topClass: string) => (
    <div
      id="mobile-menu"
      aria-hidden={!mobileNavOpen}
      className={`fixed inset-x-3 z-40 rounded-2xl bg-[#E0E0E0]/85 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-[opacity,translate] duration-300 ease-out dark:bg-[#141214]/85 md:hidden ${topClass} ${
        mobileNavOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <ul className="flex flex-col gap-0.5">
        {navItems.map((item, i) => (
          <li
            key={item.key}
            className={`transition-[opacity,translate] duration-300 ease-out ${
              mobileNavOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            }`}
            style={{
              transitionDelay: mobileNavOpen ? `${60 + i * 40}ms` : "0ms",
            }}
          >
            {renderAnchor(
              item,
              `flex items-center justify-between rounded-xl px-4 py-3 text-base transition-colors duration-300 ${
                item.isActive
                  ? "bg-black/[0.08] font-medium text-text dark:bg-white/10"
                  : "text-gray-600 dark:text-gray-300"
              }`,
              undefined,
              <>
                {item.label}
                {item.isActive && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent ?? "var(--text)" }}
                  />
                )}
              </>,
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const skipLink = (
    <a
      href="#about"
      className="absolute px-1 py-1 transition-transform duration-200 transform -translate-y-12 focus:translate-y-16 bg-secondary"
    >
      Skip to content
    </a>
  );

  const brand = (className: string) => (
    <Link href={{ pathname: "/" }} className={className}>
      <BrandSwap key={router.pathname === "/compressions" ? "c" : "n"} />
    </Link>
  );

  const dataRoute =
    router.pathname === "/compressions" ? "compressions" : undefined;

  // Accent-tinted progress fill; falls back to the original gray gradient.
  const progressStyle: React.CSSProperties = accent
    ? { width: `${scrollProgress}%`, backgroundColor: accent }
    : {
        width: `${scrollProgress}%`,
        backgroundImage: "linear-gradient(90deg, #B0B0B0, #888888, #444444)",
      };

  // =====================================================================
  // CLASSIC
  // =====================================================================
  if (NAV_STYLE === "classic") {
    return (
      <header>
        <nav
          data-route={dataRoute}
          data-nav-style={NAV_STYLE}
          className={`transition-[background-color,color,box-shadow] duration-700 ease-in-out fixed text-text bg-linear-to-b from-secondary-light/90 to-secondary-light/40 dark:from-secondary-dark/90 dark:to-secondary-dark/40 backdrop-blur-md h-16 w-full z-50 ${
            onTop ? "" : "shadow-card"
          }`}
        >
          <div className="flex h-full container justify-between items-center px-6 md:px-0">
            {skipLink}
            {brand(
              "inline-block text-text text-lg lg:text-2xl font-medium min-w-[11ch]",
            )}
            <ul className="hidden md:flex md:gap-4 lg:gap-6">
              {renderClassicItems()}
            </ul>
            <ul
              ref={navigationMobileRef}
              className={`md:hidden absolute flex flex-col w-full top-16 left-0 py-3 items-center text-white bg-primary transform translate-x-full gap-2 ${
                isMounted.current ? "transition-transform duration-300" : ""
              }`}
            >
              {renderClassicItems()}
            </ul>
            {classicMenuButton}
            <ThemeToggle variant="classic" />
          </div>
          <ProgressBar />
        </nav>
      </header>
    );
  }

  // =====================================================================
  // PILL
  // =====================================================================
  if (NAV_STYLE === "pill") {
    return (
      <header>
        <nav
          data-route={dataRoute}
          data-nav-style={NAV_STYLE}
          className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-3"
        >
          <div
            className={`pointer-events-auto relative flex h-12 items-center gap-2 overflow-hidden rounded-full bg-[#E0E0E0]/65 pl-4 pr-2 text-text shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-colors duration-700 dark:bg-[#141214]/65 md:gap-4 md:pl-5 ${
              onTop ? "" : "shadow-[0_12px_36px_rgba(0,0,0,0.3)]"
            }`}
          >
            {skipLink}
            {brand("inline-block text-base font-medium md:text-lg")}
            <ul
              ref={listRef}
              className="relative hidden items-center gap-0.5 md:flex"
            >
              {pillIndicator}
              {renderPillItems()}
            </ul>
            {modernMenuButton}
            <ThemeToggle variant={TOGGLE_STYLE} />
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-0.5 rounded-full transition-[width] duration-150 ease-out"
              style={progressStyle}
            />
          </div>
        </nav>
        {modernMobileMenu("top-16")}
      </header>
    );
  }

  // =====================================================================
  // MINIMAL
  // =====================================================================
  // Minimal brand: types the full name, wipes it, and settles on "ish" in a
  // muted color. Size stays constant; the Compressions page keeps its own.
  const minimalBrand =
    router.pathname === "/compressions" ? (
      brand(
        "inline-block text-text text-lg lg:text-2xl font-medium min-w-[11ch]",
      )
    ) : (
      <Link
        href={{ pathname: "/" }}
        className="inline-block min-w-[11ch] text-lg font-medium text-text lg:text-2xl"
      >
        <CollapsingBrand />
      </Link>
    );

  return (
    <header>
      <nav
        data-route={dataRoute}
        data-nav-style={NAV_STYLE}
        className={`fixed inset-x-0 top-0 z-50 h-16 text-text backdrop-blur-md transition-[background-color,box-shadow] duration-700 ease-in-out bg-linear-to-b from-[#E0E0E0]/85 to-[#E0E0E0]/40 dark:from-[#121212]/85 dark:to-[#121212]/40 ${
          onTop ? "" : "shadow-card"
        }`}
      >
        <div className="container flex h-full items-center justify-between px-6 md:grid md:grid-cols-[1fr_auto_1fr] md:px-0">
          {skipLink}
          <div className="md:justify-self-start">{minimalBrand}</div>
          <ul
            ref={listRef}
            className="relative hidden items-center gap-1 md:flex md:justify-self-center"
          >
            {minimalIndicator}
            {renderMinimalItems()}
          </ul>
          <div className="flex items-center gap-2 md:justify-self-end">
            <ThemeToggle variant={TOGGLE_STYLE} />
            {modernMenuButton}
          </div>
        </div>
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-0.5 transition-[width] duration-150 ease-out"
          style={progressStyle}
        />
      </nav>
      {modernMobileMenu("top-[68px]")}
    </header>
  );
};

export default NavBar;
