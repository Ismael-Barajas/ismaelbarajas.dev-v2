import { AnimatedContent, ExperienceCard, TypedText } from "components";
import { TechListType } from "components/library/TagIcons";
import {
  AddButton,
  AdminItemToolbar,
  SortableList,
} from "components/admin/lazy";
import deleteItem from "components/admin/deleteItem";
import { useExperiences, useReorder } from "hooks";
import { ADMIN_KEYS } from "lib/adminApi";
import { openDrawer, useAdminView } from "lib/adminStore";
import type { ExperienceItem, WithId } from "lib/types/content";

const TIMELINE =
  "relative mx-auto flex max-w-3xl flex-col gap-8 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-0.5 before:rounded-full before:bg-black/10 md:before:left-9 dark:before:bg-white/15";

/** The rows with their ids, or null while the list is still the public one. */
const withIds = (items: ExperienceItem[] | undefined) =>
  items && items.every((item) => typeof item.id === "number")
    ? (items as WithId<ExperienceItem>[])
    : null;

const Experience = () => {
  const { items, isAdmin, key } = useExperiences();
  const adminView = useAdminView();
  const reorder = useReorder<WithId<ExperienceItem>>("experiences", key);
  const editable = isAdmin && adminView ? withIds(items) : null;

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
        {editable ? (
          <>
            <SortableList
              items={editable}
              strategy="vertical"
              as="ol"
              itemAs="li"
              className={TIMELINE}
              getLabel={(job) => job.position}
              onReorder={reorder}
              renderItem={(job, handle) => (
                <ExperienceCard
                  as="div"
                  img={job.img}
                  body={job.body}
                  position={{
                    position: job.position,
                    time_commitment: job.timeCommitment,
                  }}
                  tags={job.tags as Array<TechListType>}
                  url={job.url}
                  adminControls={
                    <AdminItemToolbar
                      handle={handle}
                      label={job.position}
                      onEdit={() =>
                        openDrawer({
                          kind: "experience",
                          mode: "edit",
                          id: job.id,
                        })
                      }
                      onDelete={() =>
                        deleteItem(ADMIN_KEYS.experiences, job.id, key)
                      }
                    />
                  }
                />
              )}
            />
            <div className="mx-auto mt-8 flex max-w-3xl">
              <AddButton
                label="Add experience"
                className="w-full"
                onClick={() => openDrawer({ kind: "experience", mode: "create" })}
              />
            </div>
          </>
        ) : (
          <ol className={TIMELINE}>
            {items?.map((job, index) => (
              <AnimatedContent key={job.id ?? index} immediate={isAdmin}>
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
        )}
      </div>
    </div>
  );
};

export default Experience;
