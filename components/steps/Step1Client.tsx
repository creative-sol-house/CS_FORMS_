"use client";
import { InquiryData } from "@/lib/types";
import { useState } from "react";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/80 border text-purple-900 placeholder:text-purple-400 outline-none transition-all duration-200";
const inputIdle =
  "border-purple-900/20 hover:border-purple-700/50 focus:border-purple-800 focus:ring-4 focus:ring-purple-800/15 focus:bg-white";
const inputError =
  "border-rose-600/60 focus:border-rose-700 focus:ring-4 focus:ring-rose-700/15";

export default function Step1Client({ data, update, next }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailValid = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneValid = !data.phone || /^[+\d][\d\s\-()]{6,}$/.test(data.phone);

  const valid =
    data.fullName?.trim() &&
    data.email?.trim() &&
    data.phone?.trim() &&
    emailValid &&
    phoneValid &&
    (data.clientType === "Individual" || data.companyName?.trim());

  return (
    <div className="animate-[fadeIn_0.35s_ease-out]">
      {/* ============ HEADER ============ */}
      <div className="flex items-center gap-3.5 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-purple-800 border border-purple-900/30 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Client Information
          </h2>
          <p className="text-[13px] text-purple-700 mt-0.5">
            Quick details to get started
          </p>
        </div>
      </div>

      {/* ============ FORM ============ */}
      <div className="space-y-5">
        {/* Row: Name + Client Type */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <Field label="Full Name" required>
              <input
                className={`${inputBase} ${inputIdle}`}
                placeholder="John Doe"
                value={data.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
              />
            </Field>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
              I am a <span className="text-purple-900">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "Individual", label: "Individual" },
                { value: "Business", label: "Business" },
              ].map((opt) => {
                const active = data.clientType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ clientType: opt.value as any })}
                    className={`py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-purple-800 text-amber-300 ring-2 ring-purple-900/30 shadow-md shadow-purple-900/20"
                        : "bg-white/70 text-purple-800 border border-purple-900/20 hover:border-purple-700/50 hover:bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row: Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Email Address"
            required
            error={touched.email && !emailValid ? "Please enter a valid email" : undefined}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`${inputBase} ${touched.email && !emailValid ? inputError : inputIdle}`}
              placeholder="you@company.com"
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
          </Field>

          <Field
            label="Phone Number"
            required
            error={touched.phone && !phoneValid ? "Please enter a valid phone" : undefined}
          >
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={`${inputBase} ${touched.phone && !phoneValid ? inputError : inputIdle}`}
              placeholder="+1 234 567 8900"
              value={data.phone}
              onChange={(e) => update({ phone: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            />
          </Field>
        </div>

        {/* Row: Company + Role (Business only) */}
        {data.clientType === "Business" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-purple-800/5 border border-purple-900/15 animate-[fadeIn_0.3s_ease-out]">
            <Field label="Company Name" required>
              <input
                className={`${inputBase} border-purple-900/20 hover:border-purple-700/50 focus:border-purple-800 focus:ring-4 focus:ring-purple-800/15`}
                placeholder="Acme Inc."
                value={data.companyName || ""}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </Field>

            <Field label="Role / Designation" optional>
              <input
                className={`${inputBase} border-purple-900/20 hover:border-purple-700/50 focus:border-purple-800 focus:ring-4 focus:ring-purple-800/15`}
                placeholder="CTO, Manager, Founder"
                value={data.designation || ""}
                onChange={(e) => update({ designation: e.target.value })}
              />
            </Field>
          </div>
        )}
      </div>

      {/* ============ FOOTER ============ */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="hidden sm:flex items-center gap-1.5 text-[12px] text-purple-700">
          <svg className="w-3.5 h-3.5 text-purple-800" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your data is encrypted
        </p>

        <button
          disabled={!valid}
          onClick={next}
          className="group w-full sm:w-auto px-7 py-2.5 rounded-xl text-[13px] font-bold text-amber-300 bg-purple-800 hover:bg-purple-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/25"
        >
          Continue
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ========== Field Wrapper ========== */
function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
        {label}
        {required && <span className="text-purple-900">*</span>}
        {optional && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-700 bg-purple-800/10 border border-purple-900/15 px-1.5 py-0.5 rounded-md">
            opt
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-rose-700 text-[11px] mt-1.5 flex items-center gap-1.5 font-medium">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}