import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import { TagIcons } from "components";
import { FROSTED_CARD, FROSTED_CARD_HOVER } from "./Button";
import { TechListType } from "./TagIcons";

interface Props {
  img: string;
  position: Position;
  body: string[];
  tags: Array<TechListType>;
  url: string;
  /** Admin toolbar, shown at the card's top-right. */
  adminControls?: ReactNode;
  /**
   * Root element. "li" for a plain timeline; "div" when a SortableList item
   * wrapper (itself an li) already provides the list item.
   */
  as?: "li" | "div";
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
const ExperienceCard = ({
  img,
  position,
  body,
  tags,
  url,
  adminControls,
  as: Root = "li",
}: Props) => {
  return (
    <Root className="relative pl-[4.5rem] md:pl-24">
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
        className={clsx(
          FROSTED_CARD,
          FROSTED_CARD_HOVER,
          "p-5",
          adminControls && "relative",
        )}
      >
        {/* In flow on phones, floating top-right from sm up. */}
        {adminControls && (
          <div className="mb-3 flex justify-end sm:absolute sm:right-3 sm:top-3 sm:mb-0">
            {adminControls}
          </div>
        )}
        <p
          className={clsx(
            "text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400",
            adminControls && "sm:pr-32",
          )}
        >
          {position.time_commitment}
        </p>
        <h3
          className={clsx(
            "mt-0.5 text-xl font-semibold text-text",
            adminControls && "sm:pr-32",
          )}
        >
          {position.position}
        </h3>
        <div className="mt-2 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <TagIcons techs={tags} className="mt-3" />
      </div>
    </Root>
  );
};

export default ExperienceCard;
