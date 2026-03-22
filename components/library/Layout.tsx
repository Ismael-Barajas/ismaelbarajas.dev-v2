import { NextComponentType } from "next";
import { ReactNode } from "react";
import { NavBar, TargetCursor } from "..";

const Layout: NextComponentType<any, any, { children: ReactNode }> = ({ children }) => {
  return (
    <>
      <TargetCursor />
      <NavBar />
      <main className="pt-16">{children}</main>
    </>
  );
};

export default Layout;
