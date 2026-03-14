import experience from "constants/experience.json";
import { ExperienceCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";

const Experience = () => {
  return (
    <div className="relative min-h-screen-without-nav pb-12">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.2,
          transition: "--now-playing-accent 1200ms ease-in-out",
        }}
      />
      <div className="container relative z-10">
        <h2 className="font-black text-center py-5 text-text text-4xl">
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
    </div>
  );
};

export default Experience;
