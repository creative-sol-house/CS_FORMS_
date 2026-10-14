"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

const LOGO_TYPES = [
  "Abstract Mark",
  "Mascot Logo",
  "Combination Mark",
  "Emblem Logo",
  "Lettermark",
  "Pictorial Mark",
  "Wordmark",
];

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step4LogoDesign({ data, update, next, back }: Props) {
  const valid =
    data.audienceDetail?.trim() &&
    data.logoMessage?.trim() &&
    data.likedLogos?.trim() &&
    data.logoType?.trim() &&
    data.colorPreferences?.trim() &&
    data.tagline?.trim() &&
    data.competitorBranding?.trim();

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Logo Design Brief
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Help Us Craft Your Brand Identity
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Target Audience Detail" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Nature, Age, Gender, Education Level, Preferred Areas…"
            value={data.audienceDetail || ""}
            onChange={(e) => update({ audienceDetail: e.target.value })}
          />
        </Field>

        <Field label="What Message Or Emotion Do You Want Your Logo To Portray?" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Trust, Modern, Playful, Premium…"
            value={data.logoMessage || ""}
            onChange={(e) => update({ logoMessage: e.target.value })}
          />
        </Field>

        <Field label="Which Logos Do You Like And Why?" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Apple (Simplicity), Nike (Energy)…"
            value={data.likedLogos || ""}
            onChange={(e) => update({ likedLogos: e.target.value })}
          />
        </Field>

        {/* Logo Type Reference Image — sits directly above Logo Type selection */}
        <div className="rounded-2xl overflow-hidden border border-purple-900/10 bg-purple-50/40">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[12px] font-semibold text-purple-800 tracking-wide">
              Logo Type Reference
            </p>
            <p className="text-[11px] text-purple-500 mt-0.5">
              Visual Guide To Help You Choose The Right Logo Type
            </p>
          </div>
          <img
            src="/logos.png"
            alt="Logo Type Reference Guide"
            className="w-full h-auto object-contain"
          />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
            Logo Type <span className="text-purple-700">*</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LOGO_TYPES.map((t) => {
              const active = data.logoType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ logoType: t })}
                  className={`px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-purple-700 text-white shadow-md shadow-purple-700/25"
                      : "bg-white text-purple-700 border border-purple-900/15 hover:border-purple-700/40 hover:bg-purple-50/50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Colour Combination Preferences" required>
          <input
            className={inputBase}
            placeholder="E.g. Blue + White, Gold + Black…"
            value={data.colorPreferences || ""}
            onChange={(e) => update({ colorPreferences: e.target.value })}
          />
        </Field>

        <Field label="Any Tagline / Motto / Slogan" required>
          <input
            className={inputBase}
            placeholder="E.g. Just Do It"
            value={data.tagline || ""}
            onChange={(e) => update({ tagline: e.target.value })}
          />
        </Field>

        <Field label="Competitors & Your Likes/Dislikes For Their Branding" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Competitor Names + What You Like/Dislike About Their Brand…"
            value={data.competitorBranding || ""}
            onChange={(e) => update({ competitorBranding: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={back}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-purple-700 bg-white border border-purple-900/15 hover:bg-purple-50/50 hover:border-purple-700/40 transition-all duration-200"
        >
          ← Back
        </button>
        <button
          disabled={!valid}
          onClick={next}
          className="px-7 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-700 transition-all duration-200 shadow-md shadow-purple-700/25"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-800 mb-2 tracking-wide">
        {label}
        {required && <span className="text-purple-700">*</span>}
      </label>
      {children}
    </div>
  );
}