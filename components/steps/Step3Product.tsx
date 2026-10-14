"use client";
import { InquiryData } from "@/lib/types";

const FEATURES = ["Chat", "SEO", "Dashboard", "Auth", "API", "CMS", "CRM", "Project Management", "Analytics", "Team Management", "Finance", "Other"];

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step3Commodity({ data, update, next, back }: Props) {
  const toggle = (arr: string[] = [], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const valid = !!(data.commodityType?.trim() && data.commodityDelivery?.trim());

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Commodity Details
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Tell us about your commodity
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Commodity Type" required>
          <input
            className={inputBase}
            placeholder="e.g. Website Template, E-commerce, CRM…"
            value={data.commodityType || ""}
            onChange={(e) => update({ commodityType: e.target.value })}
          />
        </Field>

        <Field label="Commodity Name" optional>
          <input
            className={inputBase}
            placeholder="e.g. Acme Dashboard"
            value={data.commodityName || ""}
            onChange={(e) => update({ commodityName: e.target.value })}
          />
        </Field>

        <div>
          <p className="text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
            Features <span className="text-purple-500 font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const active = data.commodityFeatures?.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ commodityFeatures: toggle(data.commodityFeatures, f) })}
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

        <Field label="Delivery Time" required>
          <input
            className={inputBase}
            placeholder="e.g. ASAP, 1 month, 3 months…"
            value={data.commodityDelivery || ""}
            onChange={(e) => update({ commodityDelivery: e.target.value })}
          />
        </Field>

        <Field label="Reference Links" optional>
          <input
            className={inputBase}
            placeholder="https://…"
            value={data.commodityRefs || ""}
            onChange={(e) => update({ commodityRefs: e.target.value })}
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
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-purple-700/25"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function Field({
  label, required, optional, children,
}: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
        {label}
        {required && <span className="text-purple-700">*</span>}
        {optional && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-md">
            opt
          </span>
        )}
      </label>
      {children}
    </div>
  );
}