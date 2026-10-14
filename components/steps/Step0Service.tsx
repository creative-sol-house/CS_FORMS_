"use client";
import { InquiryData, ServiceCategory } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
};

const OPTIONS: {
  value: ServiceCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "Automation Software",
    label: "Automation Software",
    description: "Custom Software To Automate Your Business Workflows",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "Web Development",
    label: "Web Development",
    description: "Websites, Web Apps, And E-Commerce Solutions",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    value: "Logo Design",
    label: "Logo Design",
    description: "Brand Identity And Visual Design Services",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    value: "Digital Marketing",
    label: "Digital Marketing",
    description: "SEO, Social Media, And Online Marketing Campaigns",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
];

export default function Step0Service({ data, update, next }: Props) {
  const choose = (category: ServiceCategory) => {
    const patch: Partial<InquiryData> = { serviceCategory: category };
    if (category !== "Automation Software") {
      patch.requirementType = "Service";
    } else {
      patch.requirementType = undefined;
    }
    update(patch);
    next();
  };

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] flex flex-col">
      {/* Header — compact */}
      <div className="text-center mb-4">
       

        <h2 className="text-[18px] font-bold text-purple-900 leading-tight tracking-tight">
          What Can We Help You With?
        </h2>
        <p className="text-[12px] text-purple-600 mt-1 max-w-md mx-auto">
          Select The Service That Fits Your Needs
        </p>
      </div>

      {/* Options grid — compact, fits without scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {OPTIONS.map((opt) => {
          const active = data.serviceCategory === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              className={`group relative overflow-hidden p-3.5 rounded-xl border-2 text-left transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                active
                  ? "border-purple-800 bg-gradient-to-br from-purple-50 to-amber-50 shadow-lg shadow-purple-900/15"
                  : "border-purple-900/15 bg-white/80 hover:border-purple-700/50 hover:bg-white hover:shadow-lg hover:shadow-purple-900/10"
              }`}
            >
              {/* Subtle corner glow on hover */}
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-amber-400/0 group-hover:bg-amber-400/10 blur-2xl transition-all duration-500 pointer-events-none" />

              {/* Icon + label inline for compactness */}
              <div className="relative flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    active
                      ? "bg-purple-800 text-amber-300 shadow-md shadow-purple-900/25"
                      : "bg-purple-800/10 text-purple-800 group-hover:bg-purple-800 group-hover:text-amber-300 group-hover:shadow-md group-hover:shadow-purple-900/20"
                  }`}
                >
                  {opt.icon}
                </div>

                <p className="font-bold text-[13.5px] text-purple-900 leading-snug">
                  {opt.label}
                </p>
              </div>

              {/* Description */}
              <p className="relative text-[11.5px] text-purple-600 mt-2 leading-relaxed">
                {opt.description}
              </p>

              {/* Active check badge */}
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-purple-800 text-amber-300 flex items-center justify-center shadow-md shadow-purple-900/25 animate-[fadeIn_0.25s_ease-out]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}

              {/* Bottom accent line */}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-800 to-amber-400 transition-all duration-300 ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Footer note — compact */}
      
    </div>
  );
}