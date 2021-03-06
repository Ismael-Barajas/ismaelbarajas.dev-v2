import { Metatags, NowPlaying, TopTracks } from "components";
import type { NextPage } from "next";

const Listen: NextPage = () => {
  return (
    <div className="container min-h-screen-without-nav items-center content-center py-10">
      <Metatags
        title="Jammin out :)"
        description="What im currently listening too."
      />
      <NowPlaying />
      <TopTracks />
    </div>
  );
};

export default Listen;
