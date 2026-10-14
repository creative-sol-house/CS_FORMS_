"use client";
import { useState } from "react";
import { InquiryData } from "@/lib/types";
import Step0Service from "./steps/Step0Service";
import Step1Client from "./steps/Step1Client";
import Step2TypeSelector from "./steps/Step2Type";
import Step3Project from "./steps/Step3Project";
import Step4Commodity from "./steps/Step4Commodity";
import Step4Service from "./steps/Step4Service";
import Step4LogoDesign from "./steps/Step4LogoDesign";
import Step4WebDev from "./steps/Step4WebDev";
import Step4DigitalMarketing from "./steps/Step4DigitalMarketing";
import Step5Consent from "./steps/Step5Consent";

const initial: InquiryData = {
  fullName: "",
  email: "",
  phone: "",
  clientType: "Individual",
  agreeToTerms: false,
};

/**
 * Universal step index (0..5) with filtering:
 *  0 = Service
 *  1 = Client
 *  2 = Commodity/Service selector  (only if serviceCategory === "Automation Software")
 *  3 = Project
 *  4 = Category-specific details
 *  5 = Consent
 *
 * Non-automation flows skip slot 2 → progress bar shows "Step X of 5".
 * Automation flow shows "Step X of 6".
 */
export default function InquiryForm() {
  const [rawStep, setRawStep] = useState(0);
  const [data, setData] = useState<InquiryData>(initial);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper: skip step 2 for non-automation flows
  const isAutomation = data.serviceCategory === "Automation Software";
  const SKIP_STEP_2 = !isAutomation;
  const totalSteps = isAutomation ? 6 : 5;

  // Convert raw step → visible step (for progress display)
  const visibleStep = SKIP_STEP_2 && rawStep >= 3 ? rawStep - 1 : rawStep;

  const update = (patch: Partial<InquiryData>) =>
    setData((d) => ({ ...d, ...patch }));

  const next = () => {
    let candidate = rawStep + 1;
    // Skip slot 2 if user is not on automation
    if (SKIP_STEP_2 && candidate === 2) candidate = 3;
    setRawStep(candidate);
  };

  const back = () => {
    let candidate = rawStep - 1;
    if (SKIP_STEP_2 && candidate === 2) candidate = 1;
    setRawStep(candidate);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) setDone(true);
      else alert("Error: " + json.error);
    } catch (e: any) {
      alert("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div className="max-w-2xl mx-auto p-10 rounded-2xl bg-amber-400 border border-purple-900/20 shadow-2xl shadow-black/40 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-purple-800 border border-purple-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-purple-900 mb-2">Submitted!</h2>
        <p className="text-purple-700 text-sm">
          We've received your inquiry. We'll be in touch soon.
        </p>
      </div>
    );

  const isCommodity = data.requirementType === "Commodity";
  const isService = data.requirementType === "Service";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-7">
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-purple-700 mb-2 font-semibold">
          <span>
            Step {visibleStep + 1} of {totalSteps}
          </span>
          <span className="text-purple-900">
            {Math.round(((visibleStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-purple-900/10 rounded-full overflow-hidden border border-purple-900/10">
          <div
            className="h-full bg-purple-800 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(107,33,168,0.4)]"
            style={{
              width: `${((visibleStep + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step 0 — Service selection */}
      {rawStep === 0 && (
        <Step0Service data={data} update={update} next={next} />
      )}

      {/* Step 1 — Client info */}
      {rawStep === 1 && (
        <Step1Client
          data={data}
          update={update}
          next={next}
          back={back}
        />
      )}

      {/* Step 2 — Commodity/Service (Automation only) */}
      {rawStep === 2 && isAutomation && (
        <Step2TypeSelector
          data={data}
          update={update}
          next={next}
          back={back}
        />
      )}

      {/* Step 3 — Project details (everyone) */}
      {rawStep === 3 && (
        <Step3Project data={data} update={update} next={next} back={back} />
      )}

      {/* Step 4 — Category-specific details */}
      {rawStep === 4 && isAutomation && isCommodity && (
        <Step4Commodity data={data} update={update} next={next} back={back} />
      )}
      {rawStep === 4 && isAutomation && isService && (
        <Step4Service data={data} update={update} next={next} back={back} />
      )}
      {rawStep === 4 && data.serviceCategory === "Logo Design" && (
        <Step4LogoDesign data={data} update={update} next={next} back={back} />
      )}
      {rawStep === 4 && data.serviceCategory === "Web Development" && (
        <Step4WebDev data={data} update={update} next={next} back={back} />
      )}
      {rawStep === 4 && data.serviceCategory === "Digital Marketing" && (
        <Step4DigitalMarketing
          data={data}
          update={update}
          next={next}
          back={back}
        />
      )}

      {/* Step 5 — Consent */}
      {rawStep === 5 && (
        <Step5Consent
          data={data}
          update={update}
          back={back}
          submit={submit}
          loading={loading}
        />
      )}
    </div>
  );
}