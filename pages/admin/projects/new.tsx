import { useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { readApiError } from "lib/apiError";
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
    setError("");
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/admin");
        return;
      }
      setError(await readApiError(res, "Failed to create project"));
    } catch {
      setError("Network error. Try again.");
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-bold mb-6">New Project</h1>
      {error && (
        <p className="text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      <ProjectForm onSubmit={handleSubmit} submitLabel="Create project" />
    </AdminLayout>
  );
}
