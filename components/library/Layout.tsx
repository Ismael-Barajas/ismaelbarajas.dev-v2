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
      <main id="main-content" tabIndex={-1} className="pt-16 outline-none">
        {children}
      </main>
    </>
  );
};

export default Layout;
