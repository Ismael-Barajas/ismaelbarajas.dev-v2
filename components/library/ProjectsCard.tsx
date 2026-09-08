import Image from "next/image";
import { SiGithub } from "react-icons/si";
import { HiOutlineExternalLink } from "react-icons/hi";
import { ToolTip } from "components";
import { FROSTED_CARD, FROSTED_CARD_HOVER, IconButton } from "./Button";
import TagIcons, { TechListType } from "./TagIcons";

interface Props {
  name: string;
  img: string;
  url: string;
  github_url: string;
  body: string[];
  tags: Array<TechListType>;
}

/**
 * Image-header card: the screenshot fills the top and fades into the card,
 * the title sits on the fade, and the two link buttons float on the image.
 */
const ProjectsCard = ({ img, url, github_url, tags, body, name }: Props) => {
  return (
    <article
      className={`${FROSTED_CARD} ${FROSTED_CARD_HOVER} relative w-full max-w-lg overflow-hidden`}
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          priority
          src={img}
          fill
          sizes="(max-width: 768px) 100vw, 512px"
          alt={name}
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F0F0F0]/95 dark:to-[#202020]/95"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          <ToolTip content="Visit the live site" position="bottom">
            <IconButton
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${name}`}
              size="sm"
              className="bg-white/80 text-[#121212] backdrop-blur-md hover:bg-white dark:bg-black/60 dark:text-[#e6e6e6] dark:hover:bg-black/80"
            >
              <HiOutlineExternalLink className="h-4 w-4" />
            </IconButton>
          </ToolTip>
          <ToolTip content="View on GitHub" position="bottom">
            <IconButton
              href={github_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on GitHub`}
              size="sm"
              className="bg-white/80 text-[#121212] backdrop-blur-md hover:bg-white dark:bg-black/60 dark:text-[#e6e6e6] dark:hover:bg-black/80"
            >
              <SiGithub className="h-4 w-4" />
            </IconButton>
          </ToolTip>
        </div>
        <h3 className="absolute bottom-2 left-4 right-4 truncate text-2xl font-semibold text-text">
          {name}
        </h3>
      </div>
      <div className="px-4 pb-4 pt-1">
        <div className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <TagIcons techs={tags} className="mt-3" />
      </div>
    </article>
  );
};

export default ProjectsCard;
