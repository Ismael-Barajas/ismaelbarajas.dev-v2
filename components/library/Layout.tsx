import { NextComponentType } from "next";
import { ReactNode } from "react";
import { BootIntro, ConsoleGreeting, NavBar, NavTerminal, TargetCursor } from "..";

const Layout: NextComponentType<any, any, { children: ReactNode }> = ({ children }) => {
  return (
    <>
      <ConsoleGreeting />
      <TargetCursor />
      <NavBar />
      <NavTerminal />
      <BootIntro />
      {/* Bottom padding keeps the footer clear of the nav terminal where it
          overlaps the content column; NavTerminal publishes the value. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="pt-16 pb-[var(--terminal-inset,0px)] outline-none transition-[padding-bottom] duration-[420ms] motion-reduce:transition-none"
      >
        {children}
      </main>
    </>
  );
};

export default Layout;
