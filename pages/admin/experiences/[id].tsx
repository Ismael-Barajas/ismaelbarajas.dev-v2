import { useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "lib/session";
import { prisma } from "lib/prisma";
import AdminLayout from "components/admin/AdminLayout";
import ExperienceForm from "components/admin/ExperienceForm";

interface ExperienceData {
  id: number;
  img: string;
  url: string;
  position: string;
  timeCommitment: string;
  body: string[];
  tags: string[];
  order: number;
}

interface Props {
  experience: ExperienceData;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const session = await getIronSession<SessionData>(req as any, res as any, sessionOptions);
  if (!session.isAdmin) {
    return { redirect: { destination: "/admin/login", permanent: false } };
  }

  const id = parseInt(params?.id as string, 10);
  const experience = await prisma.experience.findUnique({
    where: { id },
    select: { id: true, img: true, url: true, position: true, timeCommitment: true, body: true, tags: true, order: true },
  });
  if (!experience) return { notFound: true };

  return { props: { experience } };
};

export default function EditExperience({ experience }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(data: object) {
    const res = await fetch(`/api/admin/experiences/${experience.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Failed to update experience");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this experience?")) return;
    await fetch(`/api/admin/experiences/${experience.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Edit Experience</h1>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
        >
          Delete
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <ExperienceForm
        initialData={experience}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </AdminLayout>
  );
}
