import { ProjectsCard } from "components";
import { TechListType } from "components/library/TagIcons";
import projects from "constants/projects.json";

const Projects = () => {
  return (
    <div className="container min-h-screen-without-nav pb-12">
      <h2 className="text-center py-5">Projects</h2>
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 justify-items-center">
        {projects.map((project, index) => {
          return (
            <ProjectsCard
              key={index}
              body={project.body}
              github_url={project.github_url}
              img={project.img}
              tags={project.tags as Array<TechListType>}
              url={project.url}
              name={project.name}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
