import { ProjectsCard } from "components";
import projects from "constants/projects.json";

const Projects = () => {
  return (
    <div className="container mx-auto min-h-screen-without-nav px-3 pb-16">
      <h2 className="text-center py-5">Projects</h2>
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 justify-items-center">
        {projects.map((project, index) => {
          return (
            <ProjectsCard
              key={index}
              body={project.body}
              github_url={project.github_url}
              img={project.img}
              tags={project.tags}
              url={project.url}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
