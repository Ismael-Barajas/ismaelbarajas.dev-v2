import { useState, FormEvent } from "react";
import { Field, ArrayField, ImageUpload } from "./FormFields";

interface ProjectData {
  img?: string;
  name?: string;
  url?: string;
  githubUrl?: string;
  body?: string[];
  tags?: string[];
  order?: number;
}

interface Props {
  initialData?: ProjectData;
  onSubmit: (data: object) => Promise<void>;
  submitLabel: string;
}

export default function ProjectForm({ initialData, onSubmit, submitLabel }: Props) {
  const [img, setImg] = useState(initialData?.img ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl ?? "");
  const [body, setBody] = useState((initialData?.body ?? []).join("\n"));
  const [tags, setTags] = useState((initialData?.tags ?? []).join(", "));
  const [order, setOrder] = useState(String(initialData?.order ?? 0));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      img,
      name,
      url,
      githubUrl,
      body: body.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      order: parseInt(order, 10) || 0,
    });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label="Name" value={name} onChange={setName} required />
      <ImageUpload label="Image" value={img} onChange={setImg} />
      <Field label="Live URL" value={url} onChange={setUrl} required />
      <Field label="GitHub URL" value={githubUrl} onChange={setGithubUrl} required />
      <ArrayField
        label="Description (one bullet per line)"
        value={body}
        onChange={setBody}
      />
      <Field
        label="Tags (comma-separated)"
        value={tags}
        onChange={setTags}
      />
      <Field label="Order" value={order} onChange={setOrder} type="number" />
      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
