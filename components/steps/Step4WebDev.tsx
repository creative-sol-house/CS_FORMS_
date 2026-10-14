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

export default function Step4WebDev({ data, update, next, back }: Props) {
  const valid =
    data.businessDescription?.trim() &&
    data.usp?.trim() &&
    data.businessKeywords?.trim() &&
    data.referenceWebsites?.trim() &&
    data.pagesNeeded?.trim() &&
    data.featuresNeeded?.trim() &&
    data.websiteGoal?.trim() &&
    data.launchDate?.trim() &&
    data.additionalSuggestions?.trim();

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Website Design Brief
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Tell Us About Your Website Requirements
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="What Will This Company Do?" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Describe Your Business In A Sentence Or Two…"
            value={data.businessDescription || ""}
            onChange={(e) => update({ businessDescription: e.target.value })}
          />
        </Field>

        <Field label="Unique Selling Proposition (USP)" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="What Makes You Different From Competitors?"
            value={data.usp || ""}
            onChange={(e) => update({ usp: e.target.value })}
          />
        </Field>

        <Field label="Keywords That Describe Your Business" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. SEO, Ecommerce, Fashion, Handmade…"
            value={data.businessKeywords || ""}
            onChange={(e) => update({ businessKeywords: e.target.value })}
          />
        </Field>

        <Field label="2-3 Reference Websites You Like & Why" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="https://example.com — I Like Their Clean Layout…"
            value={data.referenceWebsites || ""}
            onChange={(e) => update({ referenceWebsites: e.target.value })}
          />
        </Field>

        <Field label="Pages You Need On Your Website" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Home, About, Services, Products, Blog, Contact…"
            value={data.pagesNeeded || ""}
            onChange={(e) => update({ pagesNeeded: e.target.value })}
          />
        </Field>

        <Field label="Features You Need" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. User Login, Payment Gateway, Live Chat…"
            value={data.featuresNeeded || ""}
            onChange={(e) => update({ featuresNeeded: e.target.value })}
          />
        </Field>

        <Field label="Underlying Goal Of Your Website" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Generate Leads, Sell Products, Build Brand Awareness…"
            value={data.websiteGoal || ""}
            onChange={(e) => update({ websiteGoal: e.target.value })}
          />
        </Field>

        <Field label="When Would You Like To Launch Your New Site" required>
          <input
            className={inputBase}
            placeholder="E.g. Within 2 Months, Before Dec 2026…"
            value={data.launchDate || ""}
            onChange={(e) => update({ launchDate: e.target.value })}
          />
        </Field>

        <Field label="Any Additional Suggestions" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Anything Else We Should Know?"
            value={data.additionalSuggestions || ""}
            onChange={(e) => update({ additionalSuggestions: e.target.value })}
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