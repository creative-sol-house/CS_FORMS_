"use client";
import { InquiryData } from "@/lib/types";

type Props = {
  data: InquiryData;
  update: (p: Partial<InquiryData>) => void;
  next: () => void;
  back: () => void;
};

const inputBase =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border text-purple-900 placeholder:text-purple-400/70 outline-none transition-all duration-200 border-purple-900/15 hover:border-purple-700/40 focus:border-purple-700 focus:ring-4 focus:ring-purple-700/10";

export default function Step4DigitalMarketing({ data, update, next, back }: Props) {
  const valid =
    data.brandName?.trim() &&
    data.natureOfBusiness?.trim() &&
    data.businessActivities?.trim() &&
    data.majorClients?.trim() &&
    data.countryWiseMarket?.trim() &&
    data.targetAudienceFull?.trim() &&
    data.businessKeywords50?.trim() &&
    data.totalProducts?.trim() &&
    data.topRatedProducts?.trim() &&
    data.topProductKeywords?.trim() &&
    data.importantPageOrProduct?.trim() &&
    data.socialMediaCredentials?.trim() &&
    data.sampleBanners?.trim() &&
    data.sampleBlogs?.trim() &&
    data.sampleCopywriting?.trim() &&
    data.gscDetails?.trim() &&
    data.dynamicUrlRecs?.trim() &&
    data.existingSearchSubmissions?.trim() &&
    data.relevantLink?.trim() &&
    data.communityEngagements?.trim() &&
    data.serpPositioning?.trim() &&
    data.competitorNamesUrls?.trim();

  return (
    <div className="space-y-5 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-purple-700 flex items-center justify-center shrink-0 shadow-md shadow-purple-700/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-purple-900 leading-tight tracking-tight">
            Branding & Marketing Brief
          </h2>
          <p className="text-[13px] text-purple-600 mt-0.5">
            Help Us Build Your Digital Presence
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand Name" required>
            <input
              className={inputBase}
              placeholder="E.g. Acme Inc."
              value={data.brandName || ""}
              onChange={(e) => update({ brandName: e.target.value })}
            />
          </Field>

          <Field label="Nature Of Business" required>
            <input
              className={inputBase}
              placeholder="E.g. Fashion, Tech, Food…"
              value={data.natureOfBusiness || ""}
              onChange={(e) => update({ natureOfBusiness: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Business Activities" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="What Does Your Business Do Day-To-Day?"
            value={data.businessActivities || ""}
            onChange={(e) => update({ businessActivities: e.target.value })}
          />
        </Field>

        <Field label="Major Clients" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Coca-Cola, Local SMEs, Government…"
            value={data.majorClients || ""}
            onChange={(e) => update({ majorClients: e.target.value })}
          />
        </Field>

        <Field label="Country-Wise Market" required>
          <input
            className={inputBase}
            placeholder="E.g. Pakistan, UAE, UK…"
            value={data.countryWiseMarket || ""}
            onChange={(e) => update({ countryWiseMarket: e.target.value })}
          />
        </Field>

        <Field label="Target Audience (Nature, Age, Gender, Education, Countries)" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. Women 25-40, College-Educated, Urban Pakistan & UAE…"
            value={data.targetAudienceFull || ""}
            onChange={(e) => update({ targetAudienceFull: e.target.value })}
          />
        </Field>

        <Field label="Business Related Keywords (Minimum 50)" required>
          <textarea
            rows={5}
            className={`${inputBase} resize-none`}
            placeholder="Paste Comma-Separated Keywords (Min. 50)…"
            value={data.businessKeywords50 || ""}
            onChange={(e) => update({ businessKeywords50: e.target.value })}
          />
        </Field>

        <Field label="Total Products With Names" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="List All Products…"
            value={data.totalProducts || ""}
            onChange={(e) => update({ totalProducts: e.target.value })}
          />
        </Field>

        <Field label="Top Rated Products With Names" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Best Sellers / Hero Products…"
            value={data.topRatedProducts || ""}
            onChange={(e) => update({ topRatedProducts: e.target.value })}
          />
        </Field>

        <Field label="Top Rated Products Related Keywords" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Keywords For Your Hero Products…"
            value={data.topProductKeywords || ""}
            onChange={(e) => update({ topProductKeywords: e.target.value })}
          />
        </Field>

        <Field label="Important Page / Product" required>
          <input
            className={inputBase}
            placeholder="E.g. /Products/Premium-Package"
            value={data.importantPageOrProduct || ""}
            onChange={(e) => update({ importantPageOrProduct: e.target.value })}
          />
        </Field>

        <Field label="Social Media Credentials (Platform, Link, Username, Password)" required>
          <textarea
            rows={4}
            className={`${inputBase} resize-none`}
            placeholder="LinkedIn: … | Facebook: … | Instagram: … | YouTube: …"
            value={data.socialMediaCredentials || ""}
            onChange={(e) => update({ socialMediaCredentials: e.target.value })}
          />
        </Field>

        <Field label="Sample Product Banners + Recommended Color Schemes" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Describe Preferred Banner Styles / Colors…"
            value={data.sampleBanners || ""}
            onChange={(e) => update({ sampleBanners: e.target.value })}
          />
        </Field>

        <Field label="Sample Blogs" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Paste A Couple Of Sample Blog Titles Or Links…"
            value={data.sampleBlogs || ""}
            onChange={(e) => update({ sampleBlogs: e.target.value })}
          />
        </Field>

        <Field label="Sample Copywriting" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="Paste A Sample Of Your Preferred Copy Tone…"
            value={data.sampleCopywriting || ""}
            onChange={(e) => update({ sampleCopywriting: e.target.value })}
          />
        </Field>

        <Field label="Google Search Console Details" required>
          <input
            className={inputBase}
            placeholder="GSC Property URL Or Access Email…"
            value={data.gscDetails || ""}
            onChange={(e) => update({ gscDetails: e.target.value })}
          />
        </Field>

        <Field label="Dynamic URL Recommendations" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="E.g. /Products/{Slug}, /Blog/{Category}/{Slug}…"
            value={data.dynamicUrlRecs || ""}
            onChange={(e) => update({ dynamicUrlRecs: e.target.value })}
          />
        </Field>

        <Field label="Existing Search Engine Submissions" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Which Pages/Products Are Already Indexed…"
            value={data.existingSearchSubmissions || ""}
            onChange={(e) => update({ existingSearchSubmissions: e.target.value })}
          />
        </Field>

        <Field label="Please Share Relevant Link" required>
          <input
            className={inputBase}
            placeholder="https://…"
            value={data.relevantLink || ""}
            onChange={(e) => update({ relevantLink: e.target.value })}
          />
        </Field>

        <Field label="Community Engagements" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Any Communities, Forums, Or Groups You Engage With…"
            value={data.communityEngagements || ""}
            onChange={(e) => update({ communityEngagements: e.target.value })}
          />
        </Field>

        <Field label="SERP Positioning Work Till Date" required>
          <textarea
            rows={2}
            className={`${inputBase} resize-none`}
            placeholder="Any SEO Work Already Done…"
            value={data.serpPositioning || ""}
            onChange={(e) => update({ serpPositioning: e.target.value })}
          />
        </Field>

        <Field label="Competitor Names And Website Addresses" required>
          <textarea
            rows={3}
            className={`${inputBase} resize-none`}
            placeholder="Competitor 1 — https://…&#10;Competitor 2 — https://…"
            value={data.competitorNamesUrls || ""}
            onChange={(e) => update({ competitorNamesUrls: e.target.value })}
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