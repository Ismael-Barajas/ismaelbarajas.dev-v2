import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

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
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {value && (
        <Image src={value} alt="preview" width={128} height={128} className="w-32 h-32 object-cover rounded mb-2 border border-gray-700" />
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" required={required && !value} />
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
        >
          {uploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
        </button>
        {value && <span className="text-xs text-gray-500 truncate max-w-xs">{value}</span>}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
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
}

export function Field({ label, value, onChange, type = "text", required, placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
      />
    </div>
  );
}

interface ArrayFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function ArrayField({ label, value, onChange }: ArrayFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm resize-y"
      />
    </div>
  );
}
