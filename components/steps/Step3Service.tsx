"use client";
import { InquiryData } from "@/lib/types";

const FEATURES = ["Authentication", "Users Management", "Products Management", "Purchase", "HR & Payroll Management", "CRM", "CMS", "Email Automation System", "Business Proposal Engine", "Supplier Management", "Project Management", "Analytics Management", "Team Management", "Finance", "Lead Generation System", "Other"];

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step3Service({ data, update, next, back }: Props) {
  const toggle = (arr: string[] = [], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // ✅ VALIDATION
  const valid =
    data.serviceType?.trim() &&
    data.projectDescription?.trim() &&
    data.serviceFeatures?.length &&
    data.timeline?.trim() &&
    data.serviceRefs?.trim();

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Service Details
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Describe The Service You Need
          </p>
        </div>
      </div>

      {/* FIELDS */}
      <div className="space-y-5">
        <Field label="Service Type" required>
          <input
            className={inputBase}
            placeholder="E.g. Visa Consultant, Real Estate Services..."
            value={data.serviceType || ""}
            onChange={(e) => update({ serviceType: e.target.value })}
          />
        </Field>

        <Field label="Project Description" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="Describe Your Project…"
            value={data.projectDescription || ""}
            onChange={(e) => update({ projectDescription: e.target.value })}
          />
        </Field>

        {/* FEATURES */}
        <div>
          <p className="text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
            Features <span className="text-purple-700">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const active = data.serviceFeatures?.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ serviceFeatures: toggle(data.serviceFeatures, f) })}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-purple-700 text-white shadow-md shadow-purple-700/25"
                      : "bg-white text-purple-700 border border-purple-900/15 hover:border-purple-700/40 hover:bg-purple-50/50"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Timeline" required>
          <input
            className={inputBase}
            placeholder="E.g. ASAP, 1 Month, 3 Months…"
            value={data.timeline || ""}
            onChange={(e) => update({ timeline: e.target.value })}
          />
        </Field>

        <Field label="Reference Links" required>
          <input
            className={inputBase}
            placeholder="https://…"
            value={data.serviceRefs || ""}
            onChange={(e) => update({ serviceRefs: e.target.value })}
          />
        </Field>
      </div>

      {/* ACTIONS */}
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
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-700 transition-all duration-200 shadow-md shadow-purple-700/25"
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