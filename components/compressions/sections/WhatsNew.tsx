import { FiExternalLink } from "react-icons/fi";
import type { Release, ReleaseNoteItem } from "../lib/getLatestRelease";

interface Props {
  release: Release | null;
}

const MAX_ITEMS = 6;

/** Sections to skip on the landing page; they read as maintenance notes. */
const SKIP = /^(removed|internal|chores?|dependencies)$/i;

/**
 * Highlights from the latest GitHub release, read from the release body at
 * build time and refreshed on the page's revalidation schedule. Nothing here
 * is hand-maintained: cut a release with notes and this updates itself.
 */
const WhatsNew = ({ release }: Props) => {
  if (!release || release.notes.length === 0) return null;

  // Interleave sections so one long category (usually Performance) does not
  // crowd out the others. A section with a single bullet uses its heading as
  // the title, since that is how the changelog names one-off changes.
  const sections = release.notes.filter((s) => !SKIP.test(s.heading));
  const rows: (ReleaseNoteItem & { section: string })[] = [];
  const deepest = Math.max(0, ...sections.map((s) => s.items.length));
  for (let k = 0; k < deepest; k++) {
    for (const s of sections) {
      const item = s.items[k];
      if (!item) continue;
      const title = item.title ?? (s.items.length === 1 ? s.heading : null);
      rows.push({ ...item, title, section: s.heading });
    }
  }
  const items = rows.slice(0, MAX_ITEMS);
  const remaining = rows.length - items.length;

  if (items.length === 0) return null;

  return (
    <section className="c-section" id="whats-new">
      <div className="c-wrap">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div className="c-kicker" style={{ marginBottom: "0.75rem" }}>
              What&apos;s new
            </div>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", margin: 0 }}>
              {release.version}
            </h2>
          </div>
          <a
            href={release.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--c-accent)",
              fontSize: "0.9rem",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            {remaining > 0
              ? `${remaining} more in the release notes`
              : "Release notes"}{" "}
            <FiExternalLink aria-hidden />
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {items.map((item, i) => (
            <div
              key={`${item.section}-${i}`}
              className="c-card"
              style={{ padding: "1.25rem 1.35rem" }}
            >
              <div
                className="c-mono"
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--c-text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {item.section}
              </div>
              {item.title && (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  {item.title}
                </div>
              )}
              <p
                style={{
                  margin: 0,
                  color: "var(--c-text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNew;
