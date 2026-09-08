import { AnimatedContent } from "components";
import Hero from "./sections/Hero";
import Pillars from "./sections/Pillars";
import WhatsNew from "./sections/WhatsNew";
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

      <AnimatedContent>
        <Pillars />
      </AnimatedContent>

      <AnimatedContent>
        <WhatsNew release={release} />
      </AnimatedContent>

      <AnimatedContent>
        <Formats />
      </AnimatedContent>

      <AnimatedContent>
        <Capabilities />
      </AnimatedContent>

      <AnimatedContent>
        <Workflow />
      </AnimatedContent>

      <AnimatedContent>
        <Download release={release} />
      </AnimatedContent>

      <FooterMini />
    </div>
  );
};

export default CompressionsPage;
