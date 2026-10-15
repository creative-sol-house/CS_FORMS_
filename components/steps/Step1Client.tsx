"use client";
import { InquiryData } from "@/lib/types";
import { useState } from "react";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back?: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/80 border text-purple-900 placeholder:text-purple-400 outline-none transition-all duration-200";
const inputIdle =
  "border-purple-900/20 hover:border-purple-700/50 focus:border-purple-800 focus:ring-4 focus:ring-purple-800/15 focus:bg-white";
const inputError =
  "border-rose-600/60 focus:border-rose-700 focus:ring-4 focus:ring-rose-700/15";

export default function Step1Client({ data, update, next, back }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailValid = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneValid = !data.phone || /^[+\d][\d\s\-()]{6,}$/.test(data.phone);

  const valid =
    data.fullName?.trim() &&
    data.email?.trim() &&
    data.phone?.trim() &&
    data.clientType?.trim() &&
    data.consultantName?.trim() && // ← NEW: Mandatory validation
    emailValid &&
    phoneValid &&
    (data.clientType === "Individual" ||
      (data.companyName?.trim() && data.designation?.trim()));

  return (
    <div className="animate-[fadeIn_0.35s_ease-out]">
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
            Quick Details To Get Started
          </p>
        </div>
      </div>

      <div className="space-y-5">
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
              I Am A <span className="text-purple-900">*</span>
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

        {/* NEW: Consultant Name Field - Mandatory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Consultant Name" required>
            <input
              className={`${inputBase} ${inputIdle}`}
              placeholder="Enter Consultant Name"
              value={data.consultantName || ""}
              onChange={(e) => update({ consultantName: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Email Address"
            required
            error={touched.email && !emailValid ? "Please Enter A Valid Email" : undefined}
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className={`${inputBase} ${touched.email && !emailValid ? inputError : inputIdle}`}
              placeholder="You@Company.Com"
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
          </Field>

          <Field
            label="Phone Number"
            required
            error={touched.phone && !phoneValid ? "Please Enter A Valid Phone" : undefined}
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

            <Field label="Role / Designation" required>
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

      <div className="mt-8 flex items-center justify-between gap-4">
        {back ? (
          <button
            onClick={back}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 hover:border-purple-700/40 transition-all duration-200"
          >
            ← Back
          </button>
        ) : (
          <p className="hidden sm:flex items-center gap-1.5 text-[12px] text-purple-700">
            <svg className="w-3.5 h-3.5 text-purple-800" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your Data Is Encrypted
          </p>
        )}

        <button
          disabled={!valid}
          onClick={next}
          className="group w-full sm:w-auto px-7 py-2.5 rounded-xl text-[13px] font-bold text-amber-300 bg-purple-800 hover:bg-purple-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/25"
        >
          Continue
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
        {label}
        {required && <span className="text-purple-900">*</span>}
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