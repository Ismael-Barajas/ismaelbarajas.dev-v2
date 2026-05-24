import Link from "next/link";
import { FiGithub, FiArrowLeft } from "react-icons/fi";

const FooterMini = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--c-accent)",
        padding: "2.5rem 0 3rem",
        marginTop: "2rem",
      }}
    >
      <div
        className="c-wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--c-text-muted)",
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          <FiArrowLeft aria-hidden />
          Back to ismaelbarajas.dev
        </Link>

        <div
          className="c-mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            fontSize: "0.78rem",
            color: "var(--c-text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          <a
            href="https://github.com/Ismael-Barajas/compressions"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--c-text-muted)",
              textDecoration: "none",
            }}
          >
            <FiGithub aria-hidden /> GitHub
          </a>
          <span>MIT</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};

export default FooterMini;
