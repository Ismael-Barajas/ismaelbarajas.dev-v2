import { useState, FormEvent } from "react";
import type { ExperienceItem } from "lib/types/content";
import {
  Field,
  ArrayField,
  ImageUpload,
  FormError,
  SubmitButton,
  useDirty,
} from "./FormFields";

export type ExperiencePayload = Omit<ExperienceItem, "id" | "order">;

interface Props {
  initialData?: Partial<ExperienceItem>;
  onSubmit: (data: ExperiencePayload) => Promise<void>;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** Submit error to show above the button (set by the caller). */
  error?: string;
}

export default function ExperienceForm({
  initialData,
  onSubmit,
  submitLabel,
  onDirtyChange,
  error,
}: Props) {
  const touch = useDirty(onDirtyChange);
  const [img, setImg] = useState(initialData?.img ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [position, setPosition] = useState(initialData?.position ?? "");
  const [timeCommitment, setTimeCommitment] = useState(initialData?.timeCommitment ?? "");
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
        url,
        position,
        timeCommitment,
        body: body.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Position / Title"
        value={position}
        onChange={edit(setPosition)}
        required
      />
      <Field label="Company URL" value={url} onChange={edit(setUrl)} required />
      <ImageUpload label="Logo image" value={img} onChange={edit(setImg)} required />
      <Field
        label="Time commitment"
        value={timeCommitment}
        onChange={edit(setTimeCommitment)}
        placeholder="e.g. Full-time · Jan 2023 – Present"
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
