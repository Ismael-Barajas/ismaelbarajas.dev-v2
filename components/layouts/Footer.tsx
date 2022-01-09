import { NowPlaying } from "components";

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col p-6 justify-center items-center">
        <p>
          Built by{" "}
          <a
            href="https://github.com/Ismael-Barajas"
            target="_blank"
            rel="noreferrer"
            className="text-persianGreen"
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
