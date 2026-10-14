"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step3Project({ data, update, next, back }: Props) {
  const valid =
    data.projectTitle?.trim() &&
    data.projectGoals?.trim() &&
    data.targetAudience?.trim() &&
    data.existingWebsite?.trim() &&
    data.additionalNotes?.trim();

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Project Details
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Help Us Understand Your Vision
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Project Title" required>
          <input
            className={inputBase}
            placeholder="E.g. Automation Software"
            value={data.projectTitle || ""}
            onChange={(e) => update({ projectTitle: e.target.value })}
          />
        </Field>

        <Field label="Project Goals" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="What Do You Want To Achieve With This Project?"
            value={data.projectGoals || ""}
            onChange={(e) => update({ projectGoals: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Number Of Users" required>
            <input
              className={inputBase}
              placeholder="Enter Numeric Value"
              value={data.targetAudience || ""}
              onChange={(e) => update({ targetAudience: e.target.value })}
            />
          </Field>

          <Field label="Existing Website" required>
            <input
              className={inputBase}
              placeholder="https://…"
              value={data.existingWebsite || ""}
              onChange={(e) => update({ existingWebsite: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Additional Notes" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Anything Else We Should Know?"
            value={data.additionalNotes || ""}
            onChange={(e) => update({ additionalNotes: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={back}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 hover:border-purple-700/40 transition-all duration-200"
        >
          ← Back
        </button>
        <button
          disabled={!valid}
          onClick={next}
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-purple-700/70 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-700 transition-all duration-200 shadow-md shadow-purple-700/25"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
        {label}
        {required && <span className="text-purple-700">*</span>}
      </label>
      {children}
    </div>
  );
}