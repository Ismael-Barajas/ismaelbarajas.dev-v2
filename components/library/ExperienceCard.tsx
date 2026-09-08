import Image from "next/image";
import { TagIcons } from "components";
import { FROSTED_CARD } from "./Button";
import { TechListType } from "./TagIcons";

interface Props {
  img: string;
  position: Position;
  body: string[];
  tags: Array<TechListType>;
  url: string;
}

interface Position {
  position: string;
  time_commitment: string;
}

/**
 * One entry on the experience timeline. The company logo is the node on the
 * spine (a dark tile, since the logos are drawn for dark backgrounds) and
 * links to the company; the card holds dates, role, story, and stack.
 */
const ExperienceCard = ({ img, position, body, tags, url }: Props) => {
  return (
    <li className="relative pl-[4.5rem] md:pl-24">
      <a
        target="_blank"
        href={url}
        rel="noopener noreferrer"
        aria-label={`${position.position} company site`}
        className="absolute left-0 top-1 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-[#191414] shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.3)] md:left-2"
      >
        <Image
          priority
          src={img}
          fill
          sizes="56px"
          alt=""
          unoptimized={img.endsWith(".svg")}
          className="object-contain p-1.5"
        />
      </a>
      <div
        className={`${FROSTED_CARD} p-5 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]`}
      >
        <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {position.time_commitment}
        </p>
        <h3 className="mt-0.5 text-xl font-semibold text-text">
          {position.position}
        </h3>
        <div className="mt-2 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <TagIcons techs={tags} className="mt-3" />
      </div>
    </li>
  );
};

export default ExperienceCard;
