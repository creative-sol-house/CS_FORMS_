"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  back: () => void;
  submit: () => void;
  loading: boolean;
};

export default function Step5Consent({ data, update, back, submit, loading }: Props) {
  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            Almost Done!
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Just a few final details
          </p>
        </div>
      </div>

      {/* FIELDS */}
      <div className="space-y-5">
        <Field label="Preferred Contact Method" required>
          <select
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
            value={data.preferredContactMethod || ""}
            onChange={(e) => update({ preferredContactMethod: e.target.value })}
          >
            <option value="">Select a method</option>
            <option>Email</option>
            <option>Phone</option>
            <option>WhatsApp</option>
          </select>
        </Field>

        <Field label="Preferred Contact Time" optional>
          <input
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="e.g. Weekdays 9am–5pm"
            value={data.preferredContactTime || ""}
            onChange={(e) => update({ preferredContactTime: e.target.value })}
          />
        </Field>

        {/* CHECKBOXES */}
        <div className="space-y-3 pt-1">
          <Checkbox
            checked={!!data.agreeToTerms}
            onChange={(v) => update({ agreeToTerms: v })}
            label="I agree to the terms and privacy policy"
            accent="blue"
            required
          />

          <Checkbox
            checked={!!data.subscribeUpdates}
            onChange={(v) => update({ subscribeUpdates: v })}
            label="Subscribe to updates and news"
            accent="pink"
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={back}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          ← Back
        </button>

        <button
          disabled={!data.agreeToTerms || loading}
          onClick={submit}
          className="group px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              Submit
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ========== Shared Field Wrapper ========== */
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

/* ========== Custom Checkbox ========== */
function Checkbox({
  checked,
  onChange,
  label,
  accent = "blue",
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  accent?: "blue" | "pink";
  required?: boolean;
}) {
  const accentBg = accent === "blue" ? "bg-blue-50/70" : "bg-pink-50/70";
  const accentHover = accent === "blue" ? "hover:bg-blue-50" : "hover:bg-pink-50";
  const gradient =
    accent === "blue"
      ? "bg-gradient-to-br from-blue-500 to-blue-600"
      : "bg-gradient-to-br from-pink-500 to-pink-600";

  return (
    <label
      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl ${accentBg} ${accentHover} cursor-pointer transition-all duration-200 select-none`}
    >
      {/* Hidden native input for a11y */}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Custom box */}
      <span
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
          checked ? gradient : "bg-white ring-1 ring-inset ring-slate-200"
        }`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      <span className="text-[13px] text-slate-700 leading-snug">
        {label}
        {required && <span className="text-pink-500 ml-1">*</span>}
      </span>
    </label>
  );
}