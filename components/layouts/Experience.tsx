import experience from "constants/experience.json";
import { ExperienceCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";

const Experience = () => {
  return (
    <div className="container min-h-screen-without-nav pb-12">
      <h2 className="font-bold text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["Experience."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {experience.map((job, index) => {
          return (
            <ExperienceCard
              img={job.img}
              body={job.body}
              position={job.position}
              tags={job.tags as Array<TechListType>}
              key={index}
              url={job.url}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Experience;
