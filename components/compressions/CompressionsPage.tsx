import { AnimatedContent } from "components";
import Hero from "./sections/Hero";
import Pillars from "./sections/Pillars";
import Formats from "./sections/Formats";
import Capabilities from "./sections/Capabilities";
import Workflow from "./sections/Workflow";
import Download from "./sections/Download";
import FooterMini from "./sections/FooterMini";
import type { Release } from "./lib/getLatestRelease";

interface Props {
  release: Release | null;
}

const CompressionsPage = ({ release }: Props) => {
  return (
    <div data-page="compressions" className="compressions-root">
      <span className="c-noise" aria-hidden="true" />

      <Hero release={release} />

      <AnimatedContent distance={40} duration={0.7} threshold={0.15}>
        <Pillars />
      </AnimatedContent>

      <AnimatedContent distance={40} duration={0.7} threshold={0.15}>
        <Formats />
      </AnimatedContent>

      <AnimatedContent distance={40} duration={0.7} threshold={0.15}>
        <Capabilities />
      </AnimatedContent>

      <AnimatedContent distance={40} duration={0.7} threshold={0.15}>
        <Workflow />
      </AnimatedContent>

      <AnimatedContent distance={40} duration={0.7} threshold={0.15}>
        <Download release={release} />
      </AnimatedContent>

      <FooterMini />
    </div>
  );
};

export default CompressionsPage;
