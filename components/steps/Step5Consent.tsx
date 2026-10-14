"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  back: () => void;
  submit: () => void;
  loading: boolean;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step5Consent({ data, update, back, submit, loading }: Props) {
  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Almost Done!
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Just a few final details
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Preferred Contact Method" required>
          <select
            className={`${inputBase} appearance-none cursor-pointer`}
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
            className={inputBase}
            placeholder="e.g. Weekdays 9am–5pm"
            value={data.preferredContactTime || ""}
            onChange={(e) => update({ preferredContactTime: e.target.value })}
          />
        </Field>

        <div className="space-y-3 pt-1">
          <Checkbox
            checked={!!data.agreeToTerms}
            onChange={(v) => update({ agreeToTerms: v })}
            label="I agree to the terms and privacy policy"
            required
          />

          <Checkbox
            checked={!!data.subscribeUpdates}
            onChange={(v) => update({ subscribeUpdates: v })}
            label="Subscribe to updates and news"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={back}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 hover:border-purple-700/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          ← Back
        </button>

        <button
          disabled={!data.agreeToTerms || !data.preferredContactMethod || loading}
          onClick={submit}
          className="group px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-purple-700/70 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-purple-700/25"
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
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
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

function Checkbox({
  checked, onChange, label, required,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; required?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/70 border border-purple-900/15 hover:border-purple-700/40 hover:bg-purple-50/30 cursor-pointer transition-all duration-200 select-none">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
          checked ? "bg-purple-700" : "bg-white ring-1 ring-inset ring-purple-900/20"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-[13px] text-purple-800 leading-snug font-medium">
        {label}
        {required && <span className="text-purple-700 ml-1">*</span>}
      </span>
    </label>
  );
}