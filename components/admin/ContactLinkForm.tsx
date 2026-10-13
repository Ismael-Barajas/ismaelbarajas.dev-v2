import { useState, FormEvent } from "react";
import ContentIcon from "components/library/ContentIcon";
import { CONTACT_ICONS, type ContactIcon } from "lib/content/icons";
import type { ContactLinkItem } from "lib/types/content";
import {
  Field,
  FormError,
  IconPicker,
  LABEL_CLASS,
  SubmitButton,
  useDirty,
} from "./FormFields";

export type ContactLinkPayload = Pick<ContactLinkItem, "label" | "url" | "icon">;

interface Props {
  initialData?: ContactLinkItem;
  onSubmit: (data: ContactLinkPayload) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  /** Submit error to show above the button (set by the caller). */
  error?: string;
}

export default function ContactLinkForm({
  initialData,
  onSubmit,
  onDirtyChange,
  error,
}: Props) {
  const touch = useDirty(onDirtyChange);
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [icon, setIcon] = useState<ContactIcon>(initialData?.icon ?? CONTACT_ICONS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ label: label.trim(), url: url.trim(), icon });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Label"
        value={label}
        onChange={(v) => {
          touch();
          setLabel(v);
        }}
        required
      />
      <Field
        label="URL"
        value={url}
        onChange={(v) => {
          touch();
          setUrl(v);
        }}
        hint="https://… or mailto:…"
        required
      />
      <div>
        <span className={LABEL_CLASS}>
          Icon
        </span>
        <IconPicker
          label="Icon"
          icons={CONTACT_ICONS}
          value={icon}
          onChange={(next) => {
            touch();
            setIcon(next);
          }}
          renderIcon={(i) => <ContentIcon icon={i} className="h-5 w-5" />}
        />
      </div>
      <FormError message={error} />
      <SubmitButton loading={loading} label="Save" />
    </form>
  );
}
