import experience from "constants/experience.json";
import { ExperienceCard } from "components";
import { TechListType } from "components/library/TagIcons";

const Experience = () => {
  return (
    <div className="container min-h-screen-without-nav pb-12">
      {/* TODO: Header text needs to stand out more think about it */}
      <h2 className="text-center py-5">Experience</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {experience.map((job, index) => {
          return (
            <ExperienceCard
              img={job.img}
              body={job.body}
              position={job.position}
              tags={job.tags as Array<TechListType>}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Experience;
