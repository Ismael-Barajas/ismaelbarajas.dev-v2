const STEPS = [
  { n: "01", title: "Drop or paste", body: "Drag files, drag a folder, paste files or screenshots with Ctrl/Cmd+V." },
  { n: "02", title: "Pick a preset", body: "Web Optimized, High Quality, Small File Size, Social — or save your own." },
  { n: "03", title: "Press Space", body: "Live queue: add files mid-batch, cancel any individual job." },
  { n: "04", title: "Saved next door", body: "Same folder, subfolder, or custom dir. Smart suffixes prevent overwrite." },
];

const Workflow = () => {
  return (
    <section className="c-section" id="workflow">
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          Workflow
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 3rem",
            maxWidth: "22ch",
          }}
        >
          Four steps, every time.
        </h2>

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0",
            border: "1px solid var(--c-border)",
            background: "var(--c-border)",
            gridGap: "1px",
          }}
        >
          {STEPS.map((s) => (
            <li
              key={s.n}
              style={{
                background: "var(--c-bg)",
                padding: "2rem 1.5rem",
                position: "relative",
              }}
            >
              <div
                className="c-mono"
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.2em",
                  color: "var(--c-accent)",
                  marginBottom: "1.25rem",
                }}
              >
                STEP {s.n}
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  color: "var(--c-text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {s.body}
              </div>
            </li>
          ))}
        </ol>

        <div
          className="c-mono"
          style={{
            marginTop: "1.5rem",
            color: "var(--c-text-muted)",
            fontSize: "0.78rem",
            letterSpacing: "0.05em",
          }}
        >
          Right-click a video <span style={{ color: "var(--c-accent)" }}>→</span>{" "}
          Extract Audio · Convert to GIF.
        </div>
      </div>
    </section>
  );
};

export default Workflow;
