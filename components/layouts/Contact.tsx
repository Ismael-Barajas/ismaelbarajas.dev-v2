import { TypedText, MagneticButton } from "components";
import { IconButton } from "components/library/Button";
import ContentIcon from "components/library/ContentIcon";
import {
  AddButton,
  AdminItemToolbar,
  SortableList,
} from "components/admin/lazy";
import deleteItem from "components/admin/deleteItem";
import { toSavedLinks, withBuiltInIds } from "components/admin/builtInLinks";
import { useContactLinks, useReorder } from "hooks";
import { ADMIN_KEYS } from "lib/adminApi";
import { openDrawer, useAdminView } from "lib/adminStore";
import type { ContactLinkItem, WithId } from "lib/types/content";

/** The visitors' row: magnetic icon buttons that open each link. */
const ContactRow = ({ links }: { links: ContactLinkItem[] }) => (
  <div className="flex gap-4 lg:gap-6 justify-center flex-wrap">
    {links.map((link) => (
      <MagneticButton key={link.id ?? link.url}>
        <IconButton
          href={link.url}
          size="lg"
          aria-label={link.label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ContentIcon icon={link.icon} className="h-7 w-7" />
        </IconButton>
      </MagneticButton>
    ))}
  </div>
);

const Contact = ({ initialLinks }: { initialLinks: ContactLinkItem[] }) => {
  const { links, isDefault, isAdmin } = useContactLinks(initialLinks);
  const adminView = useAdminView();
  const reorder = useReorder<WithId<ContactLinkItem>>(
    "contact-links",
    ADMIN_KEYS.contactLinks,
  );
  const editing = isAdmin && adminView;
  // Saved rows have ids; the built-in links get stand-ins until the first
  // edit, delete or reorder saves them (toSavedLinks). Null while loading.
  let editable: WithId<ContactLinkItem>[] | null = null;
  if (editing && isDefault) editable = withBuiltInIds(links);
  else if (editing && links.every((link) => typeof link.id === "number")) {
    editable = links as WithId<ContactLinkItem>[];
  }

  const edit = async (link: WithId<ContactLinkItem>) => {
    const [row] = (await toSavedLinks([link])) ?? [];
    if (row) openDrawer({ kind: "contact", mode: "edit", id: row.id });
  };
  const remove = async (link: WithId<ContactLinkItem>) => {
    const [row] = (await toSavedLinks([link])) ?? [];
    if (row) {
      await deleteItem(ADMIN_KEYS.contactLinks, row.id, ADMIN_KEYS.contactLinks);
    }
  };
  const onReorder = async (next: WithId<ContactLinkItem>[]) => {
    const rows = await toSavedLinks(next);
    if (rows) await reorder(rows);
  };

  return (
    <div className="relative min-h-screen-without-nav">
      <div
        className="accent-glow absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, var(--now-playing-accent) 0%, transparent 70%)",
          opacity: 0.2,
        }}
      />
      <div className="container min-h-screen-without-nav relative z-10">
        <h2 className="font-display font-black text-center py-5 text-text text-4xl">
          <TypedText
            className="animated-underline"
            strings={["Contact Me."]}
            loop={false}
            whiteSpace={"normal"}
          />
        </h2>
        <div className="flex justify-center items-center content-center min-h-screen-contact">
          {editing ? (
            <div className="flex flex-col items-center gap-8 py-8">
              {editable ? (
                <SortableList
                  items={editable}
                  strategy="grid"
                  className="flex flex-wrap justify-center gap-4 lg:gap-6"
                  getLabel={(link) => link.label}
                  onReorder={onReorder}
                  renderItem={(link, handle) => (
                    <div className="flex flex-col items-center gap-2">
                      <IconButton
                        size="lg"
                        aria-label={`Edit ${link.label}`}
                        onClick={() => edit(link)}
                      >
                        <ContentIcon icon={link.icon} className="h-7 w-7" />
                      </IconButton>
                      <AdminItemToolbar
                        handle={handle}
                        label={link.label}
                        onEdit={() => edit(link)}
                        onDelete={() => remove(link)}
                      />
                    </div>
                  )}
                />
              ) : (
                <ContactRow links={links} />
              )}
              {isDefault && (
                <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                  Showing the built-in links. Your first change saves them.
                </p>
              )}
              <AddButton
                label="Add link"
                onClick={() => openDrawer({ kind: "contact", mode: "create" })}
              />
            </div>
          ) : (
            <ContactRow links={links} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
