import useSWR from "swr";
import { AnimatedContent, ExperienceCard, TypedText } from "components";
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
        className="accent-glow absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.2,
        }}
      />
      <div className="container relative z-10">
        <h2 className="font-display font-black text-center py-5 text-text text-4xl">
          <TypedText
            className="animated-underline"
            strings={["Experience."]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h2>
        {/* Timeline: the spine runs behind the logo nodes, newest first. */}
        <ol className="relative mx-auto flex max-w-3xl flex-col gap-8 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-0.5 before:rounded-full before:bg-black/10 md:before:left-9 dark:before:bg-white/15">
          {data?.items?.map((job, index) => (
            <AnimatedContent key={index}>
              <ExperienceCard
                img={job.img}
                body={job.body}
                position={{
                  position: job.position,
                  time_commitment: job.timeCommitment,
                }}
                tags={job.tags as Array<TechListType>}
                url={job.url}
              />
            </AnimatedContent>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Experience;
