"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

export default function Step2Type({ data, update, next, back }: Props) {
  const choose = (type: "Commodity" | "Service") => {
    update({ requirementType: type });
    next();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-purple-900">What do you need?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => choose("Commodity")}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            data.requirementType === "Commodity"
              ? "border-purple-700 bg-purple-50"
              : "border-purple-900/15 hover:border-purple-700/40"
          }`}
        >
          <p className="font-bold text-purple-900">Commodity</p>
          <p className="text-sm text-purple-600 mt-1">
            A ready-made product or template
          </p>
        </button>

        <button
          type="button"
          onClick={() => choose("Service")}
          className={`p-6 rounded-2xl border-2 text-left transition-all ${
            data.requirementType === "Service"
              ? "border-purple-700 bg-purple-50"
              : "border-purple-900/15 hover:border-purple-700/40"
          }`}
        >
          <p className="font-bold text-purple-900">Service</p>
          <p className="text-sm text-purple-600 mt-1">
            A custom project or solution
          </p>
        </button>
      </div>

      <button
        onClick={back}
        className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 transition-all"
      >
        ← Back
      </button>
    </div>
  );
}