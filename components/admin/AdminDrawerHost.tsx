import { useState, type ReactNode } from "react";
import useSWR, { mutate } from "swr";
import AdminDrawer from "./AdminDrawer";
import ProjectForm from "./ProjectForm";
import ExperienceForm from "./ExperienceForm";
import ProfileForm from "./ProfileForm";
import ContactLinkForm from "./ContactLinkForm";
import { AdminApiError, ADMIN_KEYS, adminFetch } from "lib/adminApi";
import { closeDrawer, useAdminDrawer } from "lib/adminStore";
import fetcher from "lib/fetcher";
import { pushToast } from "lib/toastStore";
import type {
  ContactLinkItem,
  ExperienceItem,
  Profile,
  ProjectItem,
  WithId,
} from "lib/types/content";

type ListResponse<T> = { items: WithId<T>[] };

const TITLES = {
  project: { create: "Add project", edit: "Edit project" },
  experience: { create: "Add experience", edit: "Edit experience" },
  profile: { create: "Edit About", edit: "Edit About" },
  contact: { create: "Add contact link", edit: "Edit contact link" },
} as const;

const Loading = ({ children = "Loading..." }: { children?: ReactNode }) => (
  <p role="status" className="py-6 text-sm text-gray-600 dark:text-gray-400">
    {children}
  </p>
);

/**
 * Mounts the one editor drawer for the homepage's admin view. Reads which
 * editor is open from adminStore, loads the row from the admin SWR cache,
 * saves through adminFetch, then revalidates, toasts and closes.
 */
const AdminDrawerHost = () => {
  const drawer = useAdminDrawer();
  const kind = drawer?.kind;

  // Only the open editor's collection is read (SWR dedupes with the sections).
  const projects = useSWR<ListResponse<ProjectItem>>(
    kind === "project" ? ADMIN_KEYS.projects : null,
    fetcher,
  );
  const experiences = useSWR<ListResponse<ExperienceItem>>(
    kind === "experience" ? ADMIN_KEYS.experiences : null,
    fetcher,
  );
  const contacts = useSWR<ListResponse<ContactLinkItem>>(
    kind === "contact" ? ADMIN_KEYS.contactLinks : null,
    fetcher,
  );
  const profile = useSWR<{ profile: Profile; isDefault: boolean }>(
    kind === "profile" ? ADMIN_KEYS.profile : null,
    fetcher,
  );

  // Dirty flag and submit error are scoped to the target they belong to, so
  // switching targets resets them without an effect.
  const formKey = drawer
    ? `${drawer.kind}-${drawer.mode}-${drawer.id ?? "new"}`
    : "";
  const [dirtyFor, setDirtyFor] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(
    null,
  );
  const dirty = dirtyFor === formKey;
  const error = errorState?.key === formKey ? errorState.message : undefined;
  const onDirtyChange = (d: boolean) => setDirtyFor(d ? formKey : null);

  /** Runs a save; on success revalidates, toasts and closes, else shows the error inline. */
  async function save(
    key: string,
    path: string,
    method: "POST" | "PUT",
    body: unknown,
    message: string,
  ) {
    setErrorState(null);
    try {
      await adminFetch(path, { method, body });
      await mutate(key);
      pushToast("success", message);
      setDirtyFor(null);
      closeDrawer();
    } catch (err) {
      setErrorState({
        key: formKey,
        message:
          err instanceof AdminApiError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  function renderForm(): ReactNode {
    if (!drawer) return null;
    const { mode, id } = drawer;
    const editing = mode === "edit";

    switch (drawer.kind) {
      case "project": {
        const item = projects.data?.items.find((p) => p.id === id);
        if (editing && !item) return <Missing loaded={!!projects.data} />;
        return (
          <ProjectForm
            key={formKey}
            initialData={item}
            submitLabel={editing ? "Save" : "Add project"}
            onDirtyChange={onDirtyChange}
            error={error}
            onSubmit={(data) =>
              save(
                ADMIN_KEYS.projects,
                editing ? `${ADMIN_KEYS.projects}/${id}` : ADMIN_KEYS.projects,
                editing ? "PUT" : "POST",
                data,
                editing ? "Project saved" : "Project added",
              )
            }
          />
        );
      }
      case "experience": {
        const item = experiences.data?.items.find((x) => x.id === id);
        if (editing && !item) return <Missing loaded={!!experiences.data} />;
        return (
          <ExperienceForm
            key={formKey}
            initialData={item}
            submitLabel={editing ? "Save" : "Add experience"}
            onDirtyChange={onDirtyChange}
            error={error}
            onSubmit={(data) =>
              save(
                ADMIN_KEYS.experiences,
                editing ? `${ADMIN_KEYS.experiences}/${id}` : ADMIN_KEYS.experiences,
                editing ? "PUT" : "POST",
                data,
                editing ? "Experience saved" : "Experience added",
              )
            }
          />
        );
      }
      case "contact": {
        const item = contacts.data?.items.find((c) => c.id === id);
        if (editing && !item) return <Missing loaded={!!contacts.data} />;
        return (
          <ContactLinkForm
            key={formKey}
            initialData={item}
            onDirtyChange={onDirtyChange}
            error={error}
            onSubmit={(data) =>
              save(
                ADMIN_KEYS.contactLinks,
                editing ? `${ADMIN_KEYS.contactLinks}/${id}` : ADMIN_KEYS.contactLinks,
                editing ? "PUT" : "POST",
                data,
                editing ? "Contact link saved" : "Contact link added",
              )
            }
          />
        );
      }
      case "profile": {
        if (!profile.data) return <Loading />;
        return (
          <ProfileForm
            key={formKey}
            initialData={profile.data.profile}
            onDirtyChange={onDirtyChange}
            error={error}
            onSubmit={(data) =>
              save(ADMIN_KEYS.profile, ADMIN_KEYS.profile, "PUT", data, "About saved")
            }
          />
        );
      }
    }
  }

  return (
    <AdminDrawer
      open={drawer !== null}
      title={drawer ? TITLES[drawer.kind][drawer.mode] : ""}
      dirty={dirty}
      onClose={() => {
        setDirtyFor(null);
        closeDrawer();
      }}
    >
      {renderForm()}
    </AdminDrawer>
  );
};

/** Edit target not in the list yet: still loading, or gone. */
const Missing = ({ loaded }: { loaded: boolean }) =>
  loaded ? <Loading>This item no longer exists.</Loading> : <Loading />;

export default AdminDrawerHost;
