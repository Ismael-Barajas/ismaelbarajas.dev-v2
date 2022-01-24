import { TypedText } from "components";
import { FaTwitter, FaInstagram, FaGithub, FaLinkedin } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";

const Contact = () => {
  return (
    <div className="container min-h-screen-without-nav">
      <h2 className="font-bold text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["Contact Me."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      <div className="flex justify-center items-center content-center min-h-screen-contact">
        <div className="flex gap-4 lg:gap-6 justify-center">
          <a
            href="https://www.linkedin.com/in/ismael-barajas/"
            className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
          >
            <FaLinkedin className="h-10 w-10" />
          </a>
          <a
            href="https://github.com/Ismael-Barajas"
            className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
          >
            <FaGithub className="h-10 w-10" />
          </a>
          <a
            href="mailto:ismaelbarajas.dev@gmail.com"
            className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
          >
            <IoIosMail className="h-10 w-10" />
          </a>
          <a
            href="https://twitter.com/InXanee"
            className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
          >
            <FaTwitter className="h-10 w-10" />
          </a>
          <a
            href="https://www.instagram.com/lnxanee/"
            className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
          >
            <FaInstagram className="h-10 w-10" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
