import type { GetStaticProps, NextPage } from "next";
import { Metatags } from "components";
import CompressionsPage from "components/compressions/CompressionsPage";
import {
  getLatestRelease,
  type Release,
} from "components/compressions/lib/getLatestRelease";

interface Props {
  release: Release | null;
  /** Build time of this ISR render; relative times are computed against it. */
  generatedAt: number;
}

const Compressions: NextPage<Props> = ({ release, generatedAt }) => {
  return (
    <>
      <Metatags
        title="Compressions: local batch compression for video, images, audio, and PDFs"
        description="Cross-platform desktop app. Compress mixed media in batches, fully offline, with hardware-accelerated codecs. Free and open source."
        image="/compressions/og.png"
      />
      <CompressionsPage release={release} generatedAt={generatedAt} />
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const release = await getLatestRelease();
  return {
    // Frozen "now" so server HTML and client hydration agree on "3 hr ago".
    props: { release, generatedAt: Date.now() },
    revalidate: 900,
  };
};

export default Compressions;
