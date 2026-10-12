"use client";
import { useState } from "react";
import { InquiryData } from "@/lib/types";
import Step1Client from "./steps/Step1Client";
import Step2Type from "./steps/Step2Type";
import Step3Product from "./steps/Step3Product";
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
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

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
<div className="max-w-2xl mx-auto p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 text-center">        <h2 className="text-2xl font-bold text-green-600 mb-2">✅ Submitted!</h2>
        <p className="text-gray-600">We've received your inquiry. We'll be in touch soon.</p>
      </div>
    );

  const isProduct = data.requirementType === "Product";
  const isService = data.requirementType === "Service";

  return (
<div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && <Step1Client data={data} update={update} next={next} />}
      {step === 2 && <Step2Type data={data} update={update} next={next} back={back} />}
      {step === 3 && isProduct && <Step3Product data={data} update={update} next={next} back={back} />}
      {step === 3 && isService && <Step3Service data={data} update={update} next={next} back={back} />}
      {step === 4 && <Step4Project data={data} update={update} next={next} back={back} />}
      {step === 5 && <Step5Consent data={data} update={update} back={back} submit={submit} loading={loading} />}
    </div>
  );
}