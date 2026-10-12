"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step2Type({ data, update, next, back }: Props) {
  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      {/* HEADER */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-800 leading-tight tracking-tight">
            What do you need?
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Pick the type that fits your project
          </p>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["Product", "Service"] as const).map((t) => {
          const active = data.requirementType === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => update({ requirementType: t })}
              className={`p-6 rounded-2xl text-left transition-all duration-200 ${
                active
                  ? "bg-gradient-to-br from-blue-500 to-pink-500 text-white"
                  : "bg-blue-50/60 hover:bg-blue-50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-[15px] tracking-tight">
                  {t}-based
                </div>
                {active && (
                  <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className={`text-[12.5px] ${active ? "text-white/85" : "text-slate-500"}`}>
                {t === "Product" ? "Ready-made solution" : "Custom development"}
              </div>
            </button>
          );
        })}
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
          disabled={!data.requirementType}
          onClick={next}
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-pink-500 transition-all duration-200"
        >
          Next →
        </button>
      </div>
    </div>
  );
}