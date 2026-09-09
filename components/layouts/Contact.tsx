import { TypedText, MagneticButton } from "components";
import { IconButton } from "components/library/Button";
import { FaInstagram, FaGithub, FaLinkedin } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";

const contactInfo = [
  {
    name: "LinkedIn",
    icon: <FaLinkedin className="h-7 w-7" />,
    url: "https://www.linkedin.com/in/ismael-barajas/",
  },
  {
    name: "GitHub",
    icon: <FaGithub className="h-7 w-7" />,
    url: "https://github.com/Ismael-Barajas",
  },
  {
    name: "Email",
    icon: <IoIosMail className="h-7 w-7" />,
    url: "mailto:ismaelbarajas.dev@gmail.com",
  },
  {
    name: "Instagram",
    icon: <FaInstagram className="h-7 w-7" />,
    url: "https://instagram.com/lnxanee",
  },
];

const Contact = () => {
  return (
    <div className="relative min-h-screen-without-nav">
      <div
        className="accent-glow absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.2,
        }}
      />
      <div className="container min-h-screen-without-nav relative z-10">
        <h2 className="font-display font-black text-center py-5 text-text text-4xl">
          <TypedText
            className="animated-underline"
            strings={["Contact Me."]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h2>
        <div className="flex justify-center items-center content-center min-h-screen-contact">
          <div className="flex gap-4 lg:gap-6 justify-center flex-wrap">
            {contactInfo.map((contact, index) => {
              return (
                <MagneticButton key={index}>
                  <IconButton
                    href={contact.url}
                    size="lg"
                    aria-label={contact.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contact.icon}
                  </IconButton>
                </MagneticButton>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
