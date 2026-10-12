"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step4Project({ data, update, next, back }: Props) {
  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            Project Details
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Help us understand your vision
          </p>
        </div>
      </div>

      {/* FIELDS */}
      <div className="space-y-5">
        <Field label="Project Title" required>
          <input
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="e.g. Acme Dashboard Redesign"
            value={data.projectTitle || ""}
            onChange={(e) => update({ projectTitle: e.target.value })}
          />
        </Field>

        <Field label="Project Goals" required>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
            placeholder="What do you want to achieve with this project?"
            value={data.projectGoals || ""}
            onChange={(e) => update({ projectGoals: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Target Audience" optional>
            <input
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-pink-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-pink-50 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
              placeholder="e.g. Small businesses"
              value={data.targetAudience || ""}
              onChange={(e) => update({ targetAudience: e.target.value })}
            />
          </Field>

          <Field label="Existing Website" optional>
            <input
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-pink-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-pink-50 focus:bg-white focus:ring-4 focus:ring-pink-500/10"
              placeholder="https://…"
              value={data.existingWebsite || ""}
              onChange={(e) => update({ existingWebsite: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Additional Notes" optional>
          <textarea
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
            placeholder="Anything else we should know?"
            value={data.additionalNotes || ""}
            onChange={(e) => update({ additionalNotes: e.target.value })}
          />
        </Field>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={back}
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={next}
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 transition-all duration-200"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/* Shared Field */
function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
        {label}
        {required && <span className="text-pink-500">*</span>}
        {optional && (
          <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
            opt
          </span>
        )}
      </label>
      {children}
    </div>
  );
}