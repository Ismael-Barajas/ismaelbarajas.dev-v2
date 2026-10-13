import { AnimatedContent, ProjectsCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";
import {
  AddButton,
  AdminItemToolbar,
  SortableList,
} from "components/admin/lazy";
import deleteItem from "components/admin/deleteItem";
import { useProjects, useReorder } from "hooks";
import { ADMIN_KEYS } from "lib/adminApi";
import { openDrawer, useAdminView } from "lib/adminStore";
import type { ProjectItem, WithId } from "lib/types/content";

const GRID =
  "grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 justify-items-center";

/** The rows with their ids, or null while the list is still the public one. */
const withIds = (items: ProjectItem[] | undefined) =>
  items && items.every((item) => typeof item.id === "number")
    ? (items as WithId<ProjectItem>[])
    : null;

const Projects = () => {
  const { items, isAdmin, key } = useProjects();
  const adminView = useAdminView();
  const reorder = useReorder<WithId<ProjectItem>>("projects", key);
  const editable = isAdmin && adminView ? withIds(items) : null;

  return (
    <div className="container min-h-screen-without-nav pb-12">
      <h2 className="font-display font-black text-center py-5 text-text text-4xl">
        <TypedText
          className="animated-underline"
          strings={["Projects."]}
          loop={false}
          whiteSpace={"normal"}
        />
      </h2>
      {editable ? (
        <>
          <SortableList
            items={editable}
            strategy="grid"
            className={GRID}
            getLabel={(project) => project.name}
            onReorder={reorder}
            renderItem={(project, handle) => (
              <ProjectsCard
                body={project.body}
                github_url={project.githubUrl}
                img={project.img}
                tags={project.tags as Array<TechListType>}
                url={project.url}
                name={project.name}
                adminControls={
                  <AdminItemToolbar
                    handle={handle}
                    label={project.name}
                    onEdit={() =>
                      openDrawer({
                        kind: "project",
                        mode: "edit",
                        id: project.id,
                      })
                    }
                    onDelete={() =>
                      deleteItem(ADMIN_KEYS.projects, project.id, key)
                    }
                  />
                }
              />
            )}
          />
          <div className="mt-8 flex justify-center">
            <AddButton
              label="Add project"
              onClick={() => openDrawer({ kind: "project", mode: "create" })}
            />
          </div>
        </>
      ) : (
        <div className={GRID}>
          {items?.map((project, index) => (
            <AnimatedContent key={project.id ?? index} immediate={isAdmin && adminView}>
              <ProjectsCard
                body={project.body}
                github_url={project.githubUrl}
                img={project.img}
                tags={project.tags as Array<TechListType>}
                url={project.url}
                name={project.name}
              />
            </AnimatedContent>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
