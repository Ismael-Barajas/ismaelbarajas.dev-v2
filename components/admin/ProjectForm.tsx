import { useState, FormEvent } from "react";
import type { ProjectItem } from "lib/types/content";
import {
  Field,
  ArrayField,
  ImageUpload,
  FormError,
  SubmitButton,
  useDirty,
} from "./FormFields";

export type ProjectPayload = Omit<ProjectItem, "id" | "order">;

interface Props {
  initialData?: Partial<ProjectItem>;
  onSubmit: (data: ProjectPayload) => Promise<void>;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** Submit error to show above the button (set by the caller). */
  error?: string;
}

export default function ProjectForm({
  initialData,
  onSubmit,
  submitLabel,
  onDirtyChange,
  error,
}: Props) {
  const touch = useDirty(onDirtyChange);
  const [img, setImg] = useState(initialData?.img ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl ?? "");
  const [body, setBody] = useState((initialData?.body ?? []).join("\n"));
  const [tags, setTags] = useState((initialData?.tags ?? []).join(", "));
  const [loading, setLoading] = useState(false);

  // Wraps a setter so any edit marks the form dirty.
  const edit = (set: (v: string) => void) => (v: string) => {
    touch();
    set(v);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        img,
        name,
        url,
        githubUrl,
        body: body.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Name" value={name} onChange={edit(setName)} required />
      <ImageUpload label="Image" value={img} onChange={edit(setImg)} required />
      <Field label="Live URL" value={url} onChange={edit(setUrl)} required />
      <Field
        label="GitHub URL"
        value={githubUrl}
        onChange={edit(setGithubUrl)}
        required
      />
      <ArrayField
        label="Description (one bullet per line)"
        value={body}
        onChange={edit(setBody)}
      />
      <Field
        label="Tags (comma-separated)"
        value={tags}
        onChange={edit(setTags)}
      />
      <FormError message={error} />
      <SubmitButton loading={loading} label={submitLabel} />
    </form>
  );
}
