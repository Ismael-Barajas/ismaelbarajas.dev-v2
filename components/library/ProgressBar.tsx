import { useEffect, useState } from "react";

const ProgressBar = () => {
  const [progress, setProgress] = useState("0");

  useEffect(() => {
    let computeProgress = () => {
      // The scrollTop gives length of window that has been scrolled
      const scrolled = document.documentElement.scrollTop;

      // scrollHeight gives total length of the window and
      // The clientHeight gives the length of viewport
      const scrollLength =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const progress = `${(100 * scrolled) / scrollLength}`;

      setProgress(progress);
    };

    // Adding event listener on mounting
    window.addEventListener("scroll", computeProgress);

    // Removing event listener upon unmounting
    return () => window.removeEventListener("scroll", computeProgress);
  });
  return (
    <div className="fixed inset-x-0 -translate-y-1 z-50">
      <div
        className="h-1 bg-gradient-to-r to-primary from-[#dcc3c0] via-[#ed9785]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
