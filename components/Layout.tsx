import { NextComponentType } from "next";
import { NavBar } from ".";

const Layout: NextComponentType = ({ children }) => {
  return (
    <>
      <NavBar />
      <main className="pt-16">{children}</main>
    </>
  );
};

export default Layout;
