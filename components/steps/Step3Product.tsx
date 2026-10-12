"use client";
import { InquiryData } from "@/lib/types";

const PRODUCTS = ["Website Template", "E-commerce", "CRM", "ERP", "Mobile App", "SaaS", "Other"];
const FEATURES = ["Payment", "Chat", "SEO", "Dashboard", "Auth", "API"];
const BUDGETS = ["<$500", "$500–$2k", "$2k–$5k", "$5k+"];
const DELIVERY = ["ASAP", "1 month", "3 months", "Flexible"];

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step3Product({ data, update, next, back }: Props) {
  const toggle = (arr: string[] = [], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            Product Details
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Tell us about your product
          </p>
        </div>
      </div>

      {/* FIELDS */}
      <div className="space-y-5">
        <Field label="Product Type" required>
          <select
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
            value={data.productType || ""}
            onChange={(e) => update({ productType: e.target.value })}
          >
            <option value="">Select product type</option>
            {PRODUCTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Product Name" optional>
          <input
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="e.g. Acme Dashboard"
            value={data.productName || ""}
            onChange={(e) => update({ productName: e.target.value })}
          />
        </Field>

        {/* FEATURES */}
        <div>
          <p className="text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
            Features
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const active = data.productFeatures?.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ productFeatures: toggle(data.productFeatures, f) })}
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

        {/* BUDGET + DELIVERY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Budget Range" required>
            <select
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-pink-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-pink-50 focus:bg-white focus:ring-4 focus:ring-pink-500/10 appearance-none cursor-pointer"
              value={data.productBudget || ""}
              onChange={(e) => update({ productBudget: e.target.value })}
            >
              <option value="">Budget range</option>
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>

          <Field label="Delivery Time" required>
            <select
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-pink-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-pink-50 focus:bg-white focus:ring-4 focus:ring-pink-500/10 appearance-none cursor-pointer"
              value={data.productDelivery || ""}
              onChange={(e) => update({ productDelivery: e.target.value })}
            >
              <option value="">Delivery time</option>
              {DELIVERY.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Reference Links" optional>
          <input
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="https://…"
            value={data.productRefs || ""}
            onChange={(e) => update({ productRefs: e.target.value })}
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