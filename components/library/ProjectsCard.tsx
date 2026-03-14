import Image from "next/image";
import { SiGithub } from "react-icons/si";
import { HiOutlineExternalLink } from "react-icons/hi";
import { ToolTip } from "components";
import TagIcons, { TechListType } from "./TagIcons";

interface Props {
  name: string;
  img: string;
  url: string;
  github_url: string;
  body: string[];
  tags: Array<TechListType>;
}

const ProjectsCard = ({ img, url, github_url, tags, body, name }: Props) => {
  return (
    <div className="rounded-md bg-linear-to-br from-primary/20 via-transparent to-transparent p-px shadow-card hover:shadow-h-card transition-all ease-in-out duration-300 transform-gpu hover:scale-[1.01] hover:-translate-y-1 max-w-lg">
      <div className="rounded-[inherit] h-full bg-background/70 dark:bg-black/30 backdrop-blur-md text-text">
        <div className="relative h-52 max-h-52 text-center mb-2">
          <Image
            priority
            src={img}
            fill
            alt={name}
            className="rounded-t-[inherit] object-cover"
          />
          <TagIcons techs={tags} className="absolute px-2 pb-1" />
        </div>
        <h3 className="text-text text-2xl text-center font-semibold">{name}</h3>
        <div className="flex justify-center py-3">
          <div className="flex">
            <ToolTip content="Visit the live site!" position="left">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex transition-all ease-in-out hover:shadow-card items-center bg-primary text-white text-sm my-1 py-1 px-3 mr-2 rounded-md duration-300 hover:brightness-110 transform-gpu active:scale-[1.08]"
              >
                <HiOutlineExternalLink className="h-5 w-5 text-white" />
              </a>
            </ToolTip>
            <ToolTip content="View the GitHub!" position="right">
              <a
                href={github_url}
                target="_blank"
                rel="noreferrer"
                className="flex transition-all ease-in-out hover:shadow-card items-center bg-primary text-white text-sm my-1 py-1 px-3 mr-2 rounded-md duration-300 hover:brightness-110 transform-gpu active:scale-[1.08]"
              >
                <SiGithub className="h-5 w-5 text-white" />
              </a>
            </ToolTip>
          </div>
        </div>
        <div className="text-lg leading-relaxed px-3 pb-3">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectsCard;
