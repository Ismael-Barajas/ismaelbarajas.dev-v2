import { NextComponentType } from "next";
import { ReactNode } from "react";
import { NavBar, CursorFollower } from "..";

const Layout: NextComponentType<any, any, { children: ReactNode }> = ({ children }) => {
  return (
    <>
      <CursorFollower />
      <NavBar />
      <main className="pt-16">{children}</main>
    </>
  );
};

export default Layout;
