import { NowPlaying } from "components";

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col p-6 justify-center items-center">
        <p className="text-sm text-gray-600 transition-colors duration-300 dark:text-gray-400">
          Built by{" "}
          <a
            href="https://github.com/Ismael-Barajas"
            target="_blank"
            rel="noopener noreferrer"
            className="animated-underline font-medium text-text"
          >
            Ismael Barajas
          </a>
        </p>
        {/* <p>Design by</p> */}
        <NowPlaying />
      </div>
    </footer>
  );
};

export default Footer;
