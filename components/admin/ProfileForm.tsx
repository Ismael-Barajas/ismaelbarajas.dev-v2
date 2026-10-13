import { useState, FormEvent } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Button, IconButton } from "components/library/Button";
import ContentIcon from "components/library/ContentIcon";
import { FACT_ICONS, type FactIcon } from "lib/content/icons";
import { AGE_TOKEN } from "lib/content/bio";
import { MAX_FACTS } from "lib/security";
import type { Profile } from "lib/types/content";
import {
  FormError,
  HINT_CLASS,
  IconPicker,
  ImageUpload,
  INPUT_CLASS,
  LABEL_CLASS,
  SubmitButton,
  useDirty,
} from "./FormFields";

interface Props {
  initialData: Profile;
  onSubmit: (profile: Profile) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  /** Submit error to show above the button (set by the caller). */
  error?: string;
}

interface Row<T> {
  key: number;
  value: T;
}

// Rows carry a stable key so removing one doesn't shuffle input state.
let nextRowKey = 0;
const row = <T,>(value: T): Row<T> => ({ key: nextRowKey++, value });

export default function ProfileForm({
  initialData,
  onSubmit,
  onDirtyChange,
  error,
}: Props) {
  const touch = useDirty(onDirtyChange);
  const [bio, setBio] = useState<Row<string>[]>(() => {
    const paragraphs = initialData.bio.length ? initialData.bio : [""];
    return paragraphs.map(row);
  });
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl);
  const [facts, setFacts] = useState<Row<{ label: string; icon: FactIcon }>[]>(
    () => initialData.facts.map(row),
  );
  const [loading, setLoading] = useState(false);

  const setParagraph = (key: number, value: string) => {
    touch();
    setBio((rows) => rows.map((r) => (r.key === key ? { ...r, value } : r)));
  };
  const setFact = (key: number, patch: Partial<{ label: string; icon: FactIcon }>) => {
    touch();
    setFacts((rows) =>
      rows.map((r) => (r.key === key ? { ...r, value: { ...r.value, ...patch } } : r)),
    );
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        bio: bio.map((r) => r.value.trim()).filter(Boolean),
        photoUrl,
        facts: facts.map((r) => ({ label: r.value.label.trim(), icon: r.value.icon })),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className={LABEL_CLASS}>Bio paragraphs</legend>
        {bio.map((r, i) => (
          <div key={r.key} className="flex items-start gap-2">
            <textarea
              aria-label={`Paragraph ${i + 1}`}
              value={r.value}
              onChange={(e) => setParagraph(r.key, e.target.value)}
              rows={4}
              required
              className={`${INPUT_CLASS} resize-y`}
            />
            <IconButton
              size="sm"
              aria-label={`Remove paragraph ${i + 1}`}
              disabled={bio.length <= 1}
              onClick={() => {
                touch();
                setBio((rows) => rows.filter((x) => x.key !== r.key));
              }}
              className="mt-1 shrink-0 disabled:opacity-40"
            >
              <FiTrash2 className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        ))}
        <p className={HINT_CLASS}>
          Use {AGE_TOKEN} to show your current age.
        </p>
        <Button
          onClick={() => {
            touch();
            setBio((rows) => [...rows, row("")]);
          }}
        >
          <FiPlus aria-hidden="true" /> Add paragraph
        </Button>
      </fieldset>

      <ImageUpload label="Photo" value={photoUrl} onChange={(u) => { touch(); setPhotoUrl(u); }} required />

      <fieldset className="space-y-3">
        <legend className={LABEL_CLASS}>Facts</legend>
        <p className={HINT_CLASS}>Drag facts on the page to reorder them.</p>
        {facts.map((r, i) => (
          <div
            key={r.key}
            className="space-y-2 rounded-xl p-3 ring-1 ring-black/10 dark:ring-white/10"
          >
            <div className="flex items-center gap-2">
              <input
                aria-label={`Fact ${i + 1} label`}
                value={r.value.label}
                onChange={(e) => setFact(r.key, { label: e.target.value })}
                required
                className={INPUT_CLASS}
              />
              <IconButton
                size="sm"
                aria-label={`Remove fact ${i + 1}`}
                onClick={() => {
                  touch();
                  setFacts((rows) => rows.filter((x) => x.key !== r.key));
                }}
                className="shrink-0"
              >
                <FiTrash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>
            <IconPicker
              compact
              label={`Fact ${i + 1} icon`}
              icons={FACT_ICONS}
              value={r.value.icon}
              onChange={(icon) => setFact(r.key, { icon })}
              renderIcon={(icon) => <ContentIcon icon={icon} className="h-4 w-4" />}
            />
          </div>
        ))}
        <Button
          disabled={facts.length >= MAX_FACTS}
          className="disabled:opacity-50"
          onClick={() => {
            touch();
            setFacts((rows) => [...rows, row({ label: "", icon: FACT_ICONS[0] })]);
          }}
        >
          <FiPlus aria-hidden="true" /> Add fact
        </Button>
        {facts.length >= MAX_FACTS && (
          <p className={HINT_CLASS}>Up to {MAX_FACTS} facts.</p>
        )}
      </fieldset>

      <FormError message={error} />
      <SubmitButton loading={loading} label="Save" />
    </form>
  );
}
