import Image from "next/image";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "components/library/Button";

/** Shared control styling so every form reads as part of the site. */
export const INPUT_CLASS =
  "w-full rounded-xl bg-black/[0.04] dark:bg-white/[0.06] px-3 py-2 text-sm text-text placeholder:text-gray-500 ring-1 ring-black/10 dark:ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text";
export const LABEL_CLASS = "mb-1 block text-sm font-medium text-primary";
export const HINT_CLASS = "mt-1 text-xs text-gray-600 dark:text-gray-400";

/**
 * "Touched" tracking for the drawer's discard prompt: the first edit reports
 * dirty once. Returns the function forms call from their change handlers.
 */
export function useDirty(onDirtyChange?: (dirty: boolean) => void) {
  const dirty = useRef(false);
  return useCallback(() => {
    if (dirty.current) return;
    dirty.current = true;
    onDirtyChange?.(true);
  }, [onDirtyChange]);
}

/** Inline submit error, announced to screen readers. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 ring-1 ring-red-500/30 dark:text-red-300"
    >
      {message}
    </p>
  );
}

/** Primary submit button shared by the forms. */
export function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={loading}
      className="disabled:opacity-50"
    >
      {loading ? "Saving..." : label}
    </Button>
  );
}

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export function ImageUpload({ label, value, onChange, required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { url } = await upload(`images/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      onChange(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {value && (
        <Image
          src={value}
          alt="Preview of the uploaded image"
          width={128}
          height={128}
          className="mb-2 h-32 w-32 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10"
        />
      )}
      {/* sr-only (not hidden) so the browser can still flag a missing required file */}
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        required={required && !value}
      />
      <div className="flex items-center gap-3">
        <Button
          variant="frosted"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="disabled:opacity-50"
        >
          {uploading ? "Uploading..." : value ? "Change image" : "Upload image"}
        </Button>
        {value && (
          <span className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-400">
            {value}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  hint,
}: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={INPUT_CLASS}
      />
      {hint && (
        <p id={`${id}-hint`} className={HINT_CLASS}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}

export function ArrayField({ label, value, onChange, rows = 5 }: ArrayFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`${INPUT_CLASS} resize-y`}
      />
    </div>
  );
}

interface IconPickerProps<T extends string> {
  /** Accessible name for the whole group. */
  label: string;
  icons: readonly T[];
  value: T;
  onChange: (icon: T) => void;
  /** Renders one option's glyph. */
  renderIcon: (icon: T) => ReactNode;
  /** Compact grid for fact rows. */
  compact?: boolean;
}

/** Radio grid of icons; native radios give arrow-key navigation for free. */
export function IconPicker<T extends string>({
  label,
  icons,
  value,
  onChange,
  renderIcon,
  compact,
}: IconPickerProps<T>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {icons.map((icon) => (
        <label
          key={icon}
          title={icon}
          className={`relative flex cursor-pointer items-center justify-center rounded-lg text-text ring-1 ring-black/10 transition-colors has-[:checked]:bg-text has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-text hover:bg-black/[0.08] dark:ring-white/10 dark:hover:bg-white/10 has-[:checked]:hover:bg-text ${
            compact ? "h-8 w-8" : "h-10 w-10"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={icon}
            checked={value === icon}
            onChange={() => onChange(icon)}
            aria-label={icon}
            className="sr-only"
          />
          {renderIcon(icon)}
        </label>
      ))}
    </div>
  );
}
