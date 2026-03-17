import { useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { prisma } from "lib/prisma";
import AdminLayout from "components/admin/AdminLayout";
import ProjectForm from "components/admin/ProjectForm";

interface ProjectData {
  id: number;
  img: string;
  name: string;
  url: string;
  githubUrl: string;
  body: string[];
  tags: string[];
  order: number;
}

interface Props {
  project: ProjectData;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const session = await getIronSession<SessionData>(req as any, res as any, sessionOptions);
  if (!session.isAdmin) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }

  const id = parseInt(params?.id as string, 10);
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, img: true, name: true, url: true, githubUrl: true, body: true, tags: true, order: true },
  });
  if (!project) return { notFound: true };

  return { props: { project } };
};

export default function EditProject({ project }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(data: object) {
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Failed to update project");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Edit Project</h1>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
        >
          Delete
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <ProjectForm
        initialData={project}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </AdminLayout>
  );
}
