import type { IconType } from "react-icons";
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCode,
  FiCoffee,
  FiFileText,
  FiGlobe,
  FiHeart,
  FiLayers,
  FiMapPin,
  FiMusic,
} from "react-icons/fi";
import { FaGithub, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoIosMail } from "react-icons/io";
import { LuGraduationCap } from "react-icons/lu";
import type { ContactIcon, FactIcon } from "lib/content/icons";

/** react-icons component for each icon key the editable content may use. */
const ICONS: Record<FactIcon | ContactIcon, IconType> = {
  // Facts
  pin: FiMapPin,
  graduation: LuGraduationCap,
  briefcase: FiBriefcase,
  layers: FiLayers,
  code: FiCode,
  globe: FiGlobe,
  heart: FiHeart,
  coffee: FiCoffee,
  music: FiMusic,
  award: FiAward,
  book: FiBookOpen,
  calendar: FiCalendar,
  // Contacts (the first four match components/layouts/Contact.tsx)
  linkedin: FaLinkedin,
  github: FaGithub,
  email: IoIosMail,
  instagram: FaInstagram,
  x: FaXTwitter,
  website: FiGlobe,
  youtube: FaYoutube,
  resume: FiFileText,
};

interface ContentIconProps {
  icon: FactIcon | ContactIcon;
  className?: string;
}

const ContentIcon = ({ icon, className }: ContentIconProps) => {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
};

export default ContentIcon;
