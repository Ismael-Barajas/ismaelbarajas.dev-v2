import type { GetStaticProps, NextPage } from "next";
import { Metatags } from "components";
import CompressionsPage from "components/compressions/CompressionsPage";
import {
  getLatestRelease,
  type Release,
} from "components/compressions/lib/getLatestRelease";

interface Props {
  release: Release | null;
}

const Compressions: NextPage<Props> = ({ release }) => {
  return (
    <>
      <Metatags
        title="Compressions: local batch compression for video, images, audio, and PDFs"
        description="Cross-platform desktop app. Compress mixed media in batches, fully offline, with hardware-accelerated codecs. Free and open source."
        image="/compressions/logo.svg"
      />
      <CompressionsPage release={release} />
    </>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const release = await getLatestRelease();
  return {
    props: { release },
    revalidate: 900,
  };
};

export default Compressions;
