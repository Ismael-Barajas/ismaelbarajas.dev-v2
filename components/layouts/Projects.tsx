import useSWR from "swr";
import { ProjectsCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";
import fetcher from "lib/fetcher";

interface ProjectItem {
  img: string;
  name: string;
  url: string;
  githubUrl: string;
  body: string[];
  tags: string[];
}

interface ProjectsResponse {
  items: ProjectItem[];
}

const Projects = () => {
  const { data } = useSWR<ProjectsResponse>("/api/projects", fetcher);

  return (
    <div className="container min-h-screen-without-nav pb-12">
      <h2 className="font-black text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["Projects."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 justify-items-center">
        {data?.items.map((project, index) => (
          <ProjectsCard
            key={index}
            body={project.body}
            github_url={project.githubUrl}
            img={project.img}
            tags={project.tags as Array<TechListType>}
            url={project.url}
            name={project.name}
          />
        ))}
      </div>
    </div>
  );
};

export default Projects;
