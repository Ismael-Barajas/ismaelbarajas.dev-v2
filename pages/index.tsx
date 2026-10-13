import { useEffect, useRef, useState } from "react";
import type { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  About,
  Contact,
  Experience,
  Footer,
  Hero,
  Metatags,
  Projects,
} from "components";
import { useAdmin } from "hooks";
import { useContactLinks } from "hooks/useContent";
import { useAdminView } from "lib/adminStore";
import { setContactLinks } from "lib/contactRegistry";
import type { SiteContent } from "lib/types/content";

/** Admin chrome (bar, drawer, toasts). Only downloaded for a signed-in owner. */
const AdminLayer = dynamic(() => import("components/admin/AdminLayer"), {
  ssr: false,
});

/** About/Contact edits call res.revalidate("/"); this is the fallback cadence. */
const REVALIDATE_SECONDS = 300;

export const getStaticProps: GetStaticProps<SiteContent> = async () => {
  // Server-only import keeps Prisma out of the client bundle.
  const { loadSiteContent } = await import("lib/content/load");
  return {
    props: await loadSiteContent(),
    revalidate: REVALIDATE_SECONDS,
  };
};

const Home: NextPage<SiteContent> = ({ profile, contactLinks }) => {
  const aboutRef = useRef(null);
  const experienceRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);
  const { isAdmin } = useAdmin();
  // Stays mounted after logout so the "Signed out" toast can still show;
  // AdminLayer hides its bar once the view is off.
  const [adminLayer, setAdminLayer] = useState(false);
  if (isAdmin && !adminLayer) setAdminLayer(true);
  const adminView = useAdminView();
  const { links } = useContactLinks(contactLinks);

  // The terminal's `open` command follows the links this page shows.
  useEffect(() => {
    setContactLinks(links);
  }, [links]);

  // Admin toolbars and Add buttons change section heights; re-measure the
  // scroll-reveal trigger points once the new layout has painted.
  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [adminView, isAdmin]);

  useEffect(() => {
    let barTimeout: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (barTimeout) clearTimeout(barTimeout);
      barTimeout = setTimeout(() => {
        document.body.classList.remove("scrolling");
      }, 700);
      document.body.classList.add("scrolling");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (barTimeout) clearTimeout(barTimeout);
      document.body.classList.remove("scrolling");
    };
  }, []);

  return (
    <>
      <Metatags />
      <Hero />
      <section id="about" ref={aboutRef}>
        <About initialProfile={profile} />
      </section>
      <section id="experience" ref={experienceRef}>
        <Experience />
      </section>
      <section id="projects" ref={projectsRef}>
        <Projects />
      </section>
      <section id="contact" ref={contactRef}>
        <Contact initialLinks={contactLinks} />
      </section>
      <Footer />
      {adminLayer && <AdminLayer />}
    </>
  );
};

export default Home;
