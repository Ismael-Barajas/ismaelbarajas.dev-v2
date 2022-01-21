import Image from "next/image";
import { TagIcons } from "components";
import { TechListType } from "./TagIcons";

interface Props {
  img: string;
  position: Position;
  body: string[];
  tags: Array<TechListType>;
}

interface Position {
  position: string;
  time_commitment: string;
}

const ExperienceCard = ({ img, position, body, tags }: Props) => {
  return (
    <div className="rounded-md p-6 shadow-card hover:shadow-h-card  transition-all ease-in-out duration-300 text-text bg-secondary  transform-gpu scale-100 hover:scale-[1.01]">
      <div className="h-full">
        <a target="_blank" href="#" rel="noopener" className="h-full">
          <div className="relative h-24 max-h-24 text-center mb-2 transition-all duration-500 ease-in-out hover:shadow-card rounded-sm transform-gpu active:scale-[0.97] active:shadow-inner">
            <Image
              priority
              src={img}
              layout="fill"
              alt="test"
              objectFit="contain"
            />
          </div>
        </a>
        <div className="text-center text-sm py-3 text-gray-500 dark:text-gray-400">
          <p>{position.position}</p>
          <p>{position.time_commitment}</p>
        </div>
        <div className="text-lg leading-relaxed">
          {body.map((paragraph, index) => {
            return <p key={index}>{paragraph}</p>;
          })}
        </div>
        <TagIcons techs={tags} />
        {/* <div className="flex flex-col mt-4 flex-grow justify-end">
          <ul className="flex flex-wrap">
            {tags.map((tag, index) => {
              return (
                <li
                  key={index}
                  className={`${tag.class} text-sm my-1 py-1 px-4 mr-2 rounded-md`}
                >
                  {tag.text}
                </li>
              );
            })}
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default ExperienceCard;
