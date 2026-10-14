"use client";
import { useState } from "react";
import { InquiryData } from "@/lib/types";
import Step1Client from "./steps/Step1Client";
import Step2Type from "./steps/Step2Type";
import Step3Commodity from "./steps/Step3Product";  // ✅ renamed
import Step3Service from "./steps/Step3Service";
import Step4Project from "./steps/Step4Project";
import Step5Consent from "./steps/Step5Consent";

const initial: InquiryData = {
  fullName: "",
  email: "",
  phone: "",
  clientType: "Individual",
  agreeToTerms: false,
};

export default function InquiryForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<InquiryData>(initial);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (patch: Partial<InquiryData>) =>
    setData((d) => ({ ...d, ...patch }));

  const next = () => {
    console.log("➡️ NEXT from step", step, "| data:", data);
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    console.log("🚀 SUBMIT — full data:", JSON.stringify(data, null, 2));
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      console.log("📥 API response:", json);
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
          <span>Step {step} of 5</span>
          <span className="text-purple-900">{Math.round((step / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-purple-900/10 rounded-full overflow-hidden border border-purple-900/10">
          <div
            className="h-full bg-purple-800 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(107,33,168,0.4)]"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && <Step1Client data={data} update={update} next={next} />}
      {step === 2 && <Step2Type data={data} update={update} next={next} back={back} />}
      {step === 3 && isCommodity && <Step3Commodity data={data} update={update} next={next} back={back} />}
      {step === 3 && isService && <Step3Service data={data} update={update} next={next} back={back} />}
      {step === 4 && <Step4Project data={data} update={update} next={next} back={back} />}
      {step === 5 && <Step5Consent data={data} update={update} back={back} submit={submit} loading={loading} />}
    </div>
  );
}