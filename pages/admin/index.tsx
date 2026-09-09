import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { prisma } from "lib/prisma";
import { readApiError } from "lib/apiError";
import AdminLayout from "components/admin/AdminLayout";

interface Project {
  id: number;
  name: string;
  url: string;
  order: number;
}

interface Experience {
  id: number;
  position: string;
  url: string;
  order: number;
}

interface Props {
  projects: Project[];
  experiences: Experience[];
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req as any, res as any, sessionOptions);
  if (!session.isAdmin) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }

  const [projects, experiences] = await Promise.all([
    prisma.project.findMany({
      select: { id: true, name: true, url: true, order: true },
      orderBy: { order: "asc" },
    }),
    prisma.experience.findMany({
      select: { id: true, position: true, url: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return { props: { projects, experiences } };
};

export default function AdminDashboard({ projects, experiences }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"projects" | "experiences">("projects");
  const [error, setError] = useState("");

  async function deleteItem(kind: "projects" | "experiences", id: number) {
    const label = kind === "projects" ? "project" : "experience";
    if (!confirm(`Delete this ${label}?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      // 404 means it is already gone; refreshing the list is still right.
      if (res.ok || res.status === 404) {
        router.replace(router.asPath);
        return;
      }
      setError(await readApiError(res, `Failed to delete ${label}`));
    } catch {
      setError("Network error. Try again.");
    }
  }

  const deleteProject = (id: number) => deleteItem("projects", id);
  const deleteExperience = (id: number) => deleteItem("experiences", id);

  return (
    <AdminLayout>
      {error && (
        <p className="text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("projects")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            tab === "projects"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setTab("experiences")}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            tab === "experiences"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Experiences ({experiences.length})
        </button>
      </div>

      {tab === "projects" && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link
              href="/admin/projects/new"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Add project
            </Link>
          </div>
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-4 py-3"
              >
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-3 text-xs text-gray-500">order: {p.order}</span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-sm">No projects yet.</p>
            )}
          </div>
        </section>
      )}

      {tab === "experiences" && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Experiences</h2>
            <Link
              href="/admin/experiences/new"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Add experience
            </Link>
          </div>
          <div className="space-y-2">
            {experiences.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-4 py-3"
              >
                <div>
                  <span className="font-medium">{e.position}</span>
                  <span className="ml-3 text-xs text-gray-500">order: {e.order}</span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/admin/experiences/${e.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteExperience(e.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {experiences.length === 0 && (
              <p className="text-gray-500 text-sm">No experiences yet.</p>
            )}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
