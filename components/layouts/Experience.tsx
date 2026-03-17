import useSWR from "swr";
import { ExperienceCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";
import fetcher from "lib/fetcher";

interface ExperienceItem {
  img: string;
  url: string;
  position: string;
  timeCommitment: string;
  body: string[];
  tags: string[];
}

interface ExperienceResponse {
  items: ExperienceItem[];
}

const Experience = () => {
  const { data } = useSWR<ExperienceResponse>("/api/experience", fetcher);

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
          {data?.items.map((job, index) => (
            <ExperienceCard
              key={index}
              img={job.img}
              body={job.body}
              position={{ position: job.position, time_commitment: job.timeCommitment }}
              tags={job.tags as Array<TechListType>}
              url={job.url}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Experience;
