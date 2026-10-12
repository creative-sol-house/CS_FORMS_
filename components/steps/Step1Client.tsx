"use client";
import { InquiryData } from "@/lib/types";
import { useState } from "react";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
};

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
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            Client Information
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="John Doe"
                value={data.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
              />
            </Field>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
              I am a <span className="text-pink-500">*</span>
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
                    className={`py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-blue-500 text-white ring-2 ring-blue-500/20"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
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
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 ${
                touched.email && !emailValid
                  ? "border-pink-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                  : "border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              }`}
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
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 ${
                touched.phone && !phoneValid
                  ? "border-pink-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                  : "border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              }`}
              placeholder="+1 234 567 8900"
              value={data.phone}
              onChange={(e) => update({ phone: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            />
          </Field>
        </div>

        {/* Row: Company + Role (Business only) */}
        {data.clientType === "Business" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-pink-50/50 border border-pink-100 animate-[fadeIn_0.3s_ease-out]">
            <Field label="Company Name" required>
              <input
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-pink-300 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                placeholder="Acme Inc."
                value={data.companyName || ""}
                onChange={(e) => update({ companyName: e.target.value })}
              />
            </Field>

            <Field label="Role / Designation" optional>
              <input
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-pink-300 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
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
        <p className="hidden sm:flex items-center gap-1.5 text-[12px] text-slate-400">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your data is encrypted
        </p>

        <button
          disabled={!valid}
          onClick={next}
          className="group w-full sm:w-auto px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Continue
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
        {label}
        {required && <span className="text-pink-500">*</span>}
        {optional && (
          <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            opt
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-pink-500 text-[11px] mt-1.5 flex items-center gap-1.5">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}