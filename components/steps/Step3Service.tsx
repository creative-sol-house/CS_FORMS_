"use client";
import { InquiryData } from "@/lib/types";

const SERVICES = ["Website Dev", "Web App", "UI/UX", "SEO", "Maintenance", "Other"];
const TECHS = ["React", "Next.js", "Node", "TypeScript", "WordPress", "Shopify"];
const FEATURES = ["Login", "Payment", "Dashboard", "API", "CMS", "Notifications", "CRM", "Project Management", "Analytics", "Team Management", "Finance", "Other"];
const TIMELINES = ["ASAP", "1 month", "3 months", "Flexible"];

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step3Service({ data, update, next, back }: Props) {
  const toggle = (arr: string[] = [], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            Service Details
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Describe the service you need
          </p>
        </div>
      </div>

      {/* FIELDS */}
      <div className="space-y-5">
        <Field label="Service Type" required>
          <select
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
            value={data.serviceType || ""}
            onChange={(e) => update({ serviceType: e.target.value })}
          >
            <option value="">Select service type</option>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="Project Description" required>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
            placeholder="Describe your project…"
            value={data.projectDescription || ""}
            onChange={(e) => update({ projectDescription: e.target.value })}
          />
        </Field>

        {/* TECH */}
        <div>
          <p className="text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
            Tech Preference
          </p>
          <div className="flex flex-wrap gap-2">
            {TECHS.map((t) => {
              const active = data.techPreference?.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ techPreference: toggle(data.techPreference, t) })}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
                      : "bg-blue-50/70 text-slate-600 hover:bg-blue-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Pages / Screens" optional>
          <input
            type="number"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="e.g. 12"
            value={data.pagesOrScreens || ""}
            onChange={(e) => update({ pagesOrScreens: +e.target.value })}
          />
        </Field>

        {/* FEATURES */}
        <div>
          <p className="text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
            Features
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const active = data.serviceFeatures?.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ serviceFeatures: toggle(data.serviceFeatures, f) })}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
                      : "bg-blue-50/70 text-slate-600 hover:bg-blue-100"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* TIMELINE (budget removed) */}
        <Field label="Timeline" required>
          <select
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-pink-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-pink-50 focus:bg-white focus:ring-4 focus:ring-pink-500/10 appearance-none cursor-pointer"
            value={data.timeline || ""}
            onChange={(e) => update({ timeline: e.target.value })}
          >
            <option value="">Timeline</option>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Reference Links" optional>
          <input
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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