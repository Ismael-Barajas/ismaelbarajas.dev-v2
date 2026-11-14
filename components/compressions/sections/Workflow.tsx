const STEPS = [
  {
    n: "01",
    title: "Add files",
    body: "Drag in files or a whole folder. Folders are scanned recursively and hidden directories are skipped. Ctrl or Cmd+V pastes copied files or a screenshot.",
  },
  {
    n: "02",
    title: "Pick a preset or set it yourself",
    body: "Video and image each have Web Optimized, High Quality, and Small File Size. Video adds Social Media, and image adds Thumbnail. Change any setting and it becomes Custom.",
  },
  {
    n: "03",
    title: "Press Space",
    body: "The queue starts. You can add more files while it runs, pause and resume, cancel everything, or cancel and retry a single file.",
  },
  {
    n: "04",
    title: "Find the output",
    body: "Same folder, a subfolder, or a folder you choose. Name files with {name}, {date}, and {time}. Nothing is overwritten; duplicates get _2, _3 suffixes.",
  },
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
            margin: "0 0 2.5rem",
            maxWidth: "22ch",
          }}
        >
          Four steps.
        </h2>

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="c-card"
              style={{ padding: "1.75rem 1.5rem", position: "relative" }}
            >
              <div
                className="c-mono"
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.2em",
                  color: "var(--c-accent)",
                  marginBottom: "1.1rem",
                }}
              >
                STEP {s.n}
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
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
            lineHeight: 1.8,
          }}
        >
          <div>
            Right-click a video to extract its audio or convert it to a GIF. The
            Tools tab does the same for every queued video.
          </div>
          <div>
            Switch the file list to Pipeline view to watch the batch as a
            diagram: the queue, a lane for each media type, the size check, and
            the output. You can drag the boxes, and pan and zoom the canvas.
          </div>
          <div>
            Shortcuts: Space starts, Escape cancels processing files, Ctrl or
            Cmd+V pastes. If compressing a file in its own format would make it
            larger, the original is kept. A file converted to another format is
            always kept.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;
