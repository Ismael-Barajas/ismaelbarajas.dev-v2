import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import AdminLayout from "components/admin/AdminLayout";
import ProjectForm from "components/admin/ProjectForm";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req as any, res as any, sessionOptions);
  if (!session.isAdmin) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }
  return { props: {} };
};

export default function NewProject() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(data: object) {
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Failed to create project");
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6">New Project</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <ProjectForm onSubmit={handleSubmit} submitLabel="Create project" />
    </AdminLayout>
  );
}
