import { TypedText } from "components";
import {
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaLinkedin,
  FaTwitch,
} from "react-icons/fa";
import { IoIosMail } from "react-icons/io";

const contactInfo = [
  {
    icon: <FaLinkedin className="h-10 w-10" />,
    url: "https://www.linkedin.com/in/ismael-barajas/",
  },
  {
    icon: <FaGithub className="h-10 w-10" />,
    url: "https://github.com/Ismael-Barajas",
  },
  {
    icon: <IoIosMail className="h-10 w-10" />,
    url: "mailto:ismaelbarajas.dev@gmail.com",
  },
  {
    icon: <FaTwitter className="h-10 w-10" />,
    url: "https://twitter.com/inxanee",
  },
  {
    icon: <FaInstagram className="h-10 w-10" />,
    url: "https://instagram.com/lnxanee",
  },
  {
    icon: <FaTwitch className="h-10 w-10" />,
    url: "https://www.twitch.tv/inxanee",
  },
];

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
          {contactInfo.map((contact, index) => {
            return (
              <a
                href={contact.url}
                className="flex items-center justify-center rounded-full h-16 w-16 hover:bg-secondary text-text content-center transition-all hover:ring-2 ring-offset-indigo-100 dark:ring-gray-200"
                target={`_blank`}
                key={index}
              >
                {contact.icon}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Contact;
