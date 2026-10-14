"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step2TypeSelector({ data, update, next, back }: Props) {
  const choose = (type: "Commodity" | "Service") => {
    update({ requirementType: type });
    next();
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            What Do You Need?
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Choose The Type Of Automation Solution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => choose("Commodity")}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
            data.requirementType === "Commodity"
              ? "border-purple-700 bg-purple-50 shadow-md shadow-purple-900/10"
              : "border-purple-900/15 bg-white/70 hover:border-purple-700/40 hover:bg-white"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-800/10 text-purple-800 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="font-bold text-purple-900">Commodity</p>
          <p className="text-sm text-purple-600 mt-1">
            You Are A Product Based Business.
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose("Service")}
          className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
            data.requirementType === "Service"
              ? "border-purple-700 bg-purple-50 shadow-md shadow-purple-900/10"
              : "border-purple-900/15 bg-white/70 hover:border-purple-700/40 hover:bg-white"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-800/10 text-purple-800 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <p className="font-bold text-purple-900">Service</p>
          <p className="text-sm text-purple-600 mt-1">
            You Are A Service Provider.
          </p>
        </button>
      </div>

      <div className="flex justify-start pt-2">
        <button
          onClick={back}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 hover:border-purple-700/40 transition-all duration-200"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}