"use client";
import { useState } from "react";
import { LeadAttachment } from "@/lib/types";

const ALLOWED = ".pdf,.doc,.docx,.xls,.xlsx";
const MAX_MB = 10;

export default function FileUpload({
  attachments,
  onChange,
}: {
  attachments: LeadAttachment[];
  onChange: (next: LeadAttachment[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr("");
    const next = [...attachments];

    for (const file of Array.from(files)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setErr(`${file.name} exceeds ${MAX_MB} MB`);
        continue;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", "lead"); // <--- FIX: Tells backend this is a lead attachment, not a profile picture
        
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Upload failed");
        next.push(json.attachment);
        onChange([...next]);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const remove = async (idx: number) => {
    const target = attachments[idx];
    if (target.publicId) {
      fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: target.publicId }),
      }).catch(() => {});
    }
    onChange(attachments.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="group flex flex-col items-center justify-center gap-2 w-full min-h-[120px] px-4 py-6 border-2 border-dashed border-stone-300 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-colors">
        <svg className="w-8 h-8 text-stone-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-semibold text-stone-700">
            {uploading ? "Uploading…" : "Click to attach files"}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">PDF, Word, Excel · up to {MAX_MB} MB each</p>
        </div>
        <input
          type="file"
          multiple
          accept={ALLOWED}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }}
        />
      </label>

      {err && <p className="text-xs text-rose-600 font-medium">{err}</p>}

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a, i) => (
            <li key={a.publicId || i} className="flex items-center gap-3 px-3 py-2 bg-white border border-stone-200 rounded-lg">
              <FileIcon type={a.fileType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{a.fileName}</p>
                <p className="text-[11px] text-stone-500">{(a.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <a href={a.url} target="_blank" rel="noreferrer" className="p-1.5 text-stone-500 hover:text-indigo-600 rounded-md hover:bg-stone-100" title="Open">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button type="button" onClick={() => remove(i)} className="p-1.5 text-stone-500 hover:text-rose-600 rounded-md hover:bg-rose-50" title="Remove">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  const color =
    type.includes("pdf") ? "bg-rose-50 text-rose-600 border-rose-200" :
    type.includes("word") || type.includes("doc") ? "bg-blue-50 text-blue-600 border-blue-200" :
    "bg-emerald-50 text-emerald-600 border-emerald-200";
  const label =
    type.includes("pdf") ? "PDF" :
    type.includes("word") || type.includes("doc") ? "DOC" : "XLS";
  return (
    <span className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center text-[10px] font-bold ${color}`}>
      {label}
    </span>
  );
}