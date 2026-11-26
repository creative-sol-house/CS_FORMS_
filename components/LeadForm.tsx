"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  InquiryData,
  ServiceCategory,
  ClientType,
  RequirementType,
  CommunicationMode,
  LeadAttachment,
  SocialLink,
} from "@/lib/types";
import FileUpload from "@/components/FileUpload";

const SERVICES: { value: ServiceCategory; label: string; desc: string }[] = [
  { value: "Automation Software", label: "Automation Software", desc: "Bots, integrations, workflow automation" },
  { value: "Web Development",     label: "Web Development",     desc: "Websites, web apps, e-commerce" },
  { value: "Logo Design",         label: "Logo Design",         desc: "Branding, logo, visual identity" },
  { value: "Digital Marketing",   label: "Digital Marketing",   desc: "SEO, ads, social, content" },
];

const CONTACT_METHODS: CommunicationMode[] = [
  "Call", "WhatsApp Msg", "WhatsApp Call", "Text Msg", "Email", "Zoom Meeting", "Onsite Meeting",
];

/* ✅ NEW: Common social platforms for the dropdown */
const SOCIAL_PLATFORMS = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Twitter / X",
  "YouTube",
  "TikTok",
  "WhatsApp",
  "Telegram",
  "Pinterest",
  "Snapchat",
  "Threads",
  "Reddit",
  "Other",
];

/* ✅ NEW: All countries (ISO names) */
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

interface Props {
  consultantName: string;
  consultantId: string;
  lockedService?: ServiceCategory;
  /** If provided → edit mode */
  leadId?: string;
  initialData?: Partial<InquiryData>;
  onClose: () => void;
  onSaved: (lead: any) => void;
}

type Step = 0 | 1 | 2 | 3 | 4;

export default function LeadForm({
  consultantName,
  consultantId,
  lockedService,
  leadId,
  initialData,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(leadId);
  const startingService = lockedService ?? initialData?.serviceCategory;

  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | undefined>(startingService);
  const [step, setStep] = useState<Step>(startingService ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [data, setData] = useState<Partial<InquiryData>>(() => ({
    clientType: "Business",
    consultantName,
    agreeToTerms: true,
    subscribeUpdates: false,
    country: "Pakistan", // ✅ SET DEFAULT TO PAKISTAN
    leadCreatedAt: initialData?.leadCreatedAt || new Date().toISOString(),
    socialLinks: initialData?.socialLinks || [],
    ...initialData, // (If editing, initialData will override this default)
  }));

  const [attachments, setAttachments] = useState<LeadAttachment[]>(
    () => (initialData?.attachments as LeadAttachment[] | undefined) ?? []
  );

  const set = <K extends keyof InquiryData>(k: K, v: InquiryData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const stepErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step >= 1) {
      if (!data.companyName?.trim()) e.companyName = "Required";
if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
  e.email = "Invalid email";
}
      if (!data.phone?.trim()) e.phone = "Required";
      else if (!/^[+\d][\d\s\-()]{5,}$/.test(data.phone)) e.phone = "Invalid phone";
      if (!data.country?.trim()) e.country = "Required";
    }
    return e;
  }, [data, step]);
  const canAdvance = Object.keys(stepErrors).length === 0;

  const submit = async () => {
    setSaving(true);
    setErr("");
    try {
// ✅ International client detection — snapshot at save time
const LOCAL_COUNTRY = "Pakistan";
const isInternationalClient =
  !!data.country && data.country.trim() !== "" && data.country.trim() !== LOCAL_COUNTRY;

const body = {
  ...data,
  country: data.country?.trim() || "",
  attachments,
  serviceCategory,
  isInternationalClient,
  clientRegion: isInternationalClient ? "International" : "Local",
  consultantName: isEdit ? data.consultantName || consultantName : consultantName,
  consultantId:  isEdit ? data.consultantId  || consultantId  : consultantId,
  createdBy:   data.createdBy  || consultantName,
  createdById: data.createdById || consultantId,
};

      const res = isEdit
        ? await fetch("/api/admin/inquiries", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: leadId, updates: body }),
          })
        : await fetch("/api/admin/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save lead");
      onSaved(json.inquiry);
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => {
    const total = startingService ? 4 : 5;
    const done = step + 1 + (startingService ? 0 : 1);
    return Math.round((done / total) * 100);
  }, [step, startingService]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full sm:max-w-3xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[94vh] ring-1 ring-stone-900/5">
        {/* Header */}
        <div className="relative bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-indigo-200">
                {isEdit ? "Edit Lead" : "New Lead"} · Step {step + 1} of {startingService ? 4 : 5}
              </p>
              <h2 className="text-lg sm:text-2xl font-semibold mt-0.5 truncate">
                {step === 0
                  ? "What service is this for?"
                  : step === 1
                  ? "Client details"
                  : step === 2
                  ? "Project details"
                  : step === 3
                  ? "Extra content"
                  : "Review & submit"}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 mt-1 truncate">
                {serviceCategory
                  ? `${serviceCategory} · ${data.consultantName || consultantName}`
                  : "Pick a category to begin."}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-2 hover:bg-white/15 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">
          {step === 0 && (
            <StepService
              value={serviceCategory}
              onChange={(s) => {
                setServiceCategory(s);
                setStep(1);
              }}
            />
          )}
          {step === 1 && <StepClient data={data} set={set} errors={stepErrors} />}
          {step === 2 && serviceCategory && (
            <StepServiceDetails
              service={serviceCategory}
              data={data}
              set={set}
            />
          )}
          {step === 3 && <StepAttachments value={attachments} onChange={setAttachments} />}
          {step === 4 && (
            <StepReview
              data={data}
              service={serviceCategory}
              consultantName={data.consultantName || consultantName}
              set={set}
              attachments={attachments}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-200 bg-stone-50 px-4 sm:px-6 py-3 sm:py-4">
          {err && (
            <div className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (step === 0) onClose();
                else setStep((s) => (s - 1) as Step);
              }}
              className="px-3 sm:px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              {step === 0 ? "Cancel" : "← Back"}
            </button>

            <div className="flex items-center gap-2">
              {step < 4 && (
                <button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={step === 1 && !canAdvance}
                  className="px-4 sm:px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Continue →
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={submit}
                  disabled={saving}
                  className="px-4 sm:px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Lead"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Step 0 ─────────────── */
function StepService({ value, onChange }: { value?: ServiceCategory; onChange: (s: ServiceCategory) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SERVICES.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
              active
                ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                : "border-stone-200 hover:border-indigo-400 hover:bg-indigo-50/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-900 text-sm">{s.label}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
              <span
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  active ? "border-indigo-600 bg-indigo-600" : "border-stone-300 group-hover:border-indigo-400"
                }`}
              >
                {active && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── Step 1 ─────────────── */
function StepClient({
  data, set, errors,
}: {
  data: Partial<InquiryData>;
  set: <K extends keyof InquiryData>(k: K, v: InquiryData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader title="Client information" subtitle="Basic details so we can reach them." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name"  >
          <TextInput value={data.fullName || ""} onChange={(v) => set("fullName", v)} placeholder="Jane Doe" autoFocus />
        </Field>
        <Field label="Client type" required>
          <Select
            value={data.clientType || "Business"}
            onChange={(v) => set("clientType", v as ClientType)}
            options={[{ value: "Individual", label: "Individual" }, { value: "Business", label: "Business" }]}
          />
        </Field>
        <Field label="Email"  error={errors.email}>
          <TextInput type="email" value={data.email || ""} onChange={(v) => set("email", v)} placeholder="jane@company.com" />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <TextInput type="tel" value={data.phone || ""} onChange={(v) => set("phone", v)} placeholder="+1 555 123 4567" />
        </Field>

<Field label="Country" required error={errors.country}>
  <SearchableSelect
    value={data.country || ""}
    onChange={(v) => set("country", v)}
    options={COUNTRIES}
    placeholder="Search country…"
  />
  {data.country && data.country !== "Pakistan" && (
    <p className="mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Will be tagged as <strong>International Client</strong>
    </p>
  )}
</Field>

        {/* ✅ Location */}
        <Field label="Location (City / Region)">
          <TextInput
            value={data.location || ""}
            onChange={(v) => set("location", v)}
            placeholder="e.g. Karachi, Sindh"
          />
        </Field>

        <Field label="Company name required" required error={errors.companyName}>
          <TextInput value={data.companyName || ""} onChange={(v) => set("companyName", v)} placeholder="Acme Inc. " />
        </Field>

        {/* ✅ Job Title */}
        <Field label="Job Title">
          <TextInput
            value={data.jobTitle || ""}
            onChange={(v) => set("jobTitle", v)}
            placeholder="e.g. Marketing Manager"
          />
        </Field>

        <Field label="Designation">
          <TextInput value={data.designation || ""} onChange={(v) => set("designation", v)} placeholder="Marketing Head" />
        </Field>

        {/* ✅ Company Website */}
        <Field label="Company Website">
          <TextInput
            type="url"
            value={data.companyWebsite || ""}
            onChange={(v) => set("companyWebsite", v)}
            placeholder="https://company.com"
          />
        </Field>

        <Field label="Lead Created" required>
          <input
            type="datetime-local"
            value={toDatetimeLocal(data.leadCreatedAt)}
            onChange={(e) => set("leadCreatedAt", new Date(e.target.value).toISOString())}
            className={`${inputBase} border-stone-300 hover:border-stone-400`}
          />
        </Field>
      </div>

      {/* ✅ Social links — full-width, dropdown + custom */}
      <div>
        <SectionHeader title="Social Links" subtitle="Add platform names and their URLs (if no website)." />
        <div className="mt-3">
          <SocialLinksInput
            value={data.socialLinks}
            onChange={(v) => set("socialLinks", v)}
          />
        </div>
      </div>

      {/* ✅ Client requirements */}
      <div>
        <SectionHeader title="Client Requirements" subtitle="What does the client need?" />
        <div className="mt-3">
          <Field label="Requirements description">
            <TextArea
              value={data.clientRequirements || ""}
              onChange={(v) => set("clientRequirements", v)}
              placeholder="Describe what the client is looking for…"
              rows={4}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Step 2 ─────────────── */
function StepServiceDetails({
  service, data, set,
}: {
  service: ServiceCategory;
  data: Partial<InquiryData>;
  set: <K extends keyof InquiryData>(k: K, v: InquiryData[K]) => void;
}) {
  if (service === "Automation Software") return <AutomationFields data={data} set={set} />;
  if (service === "Web Development")     return <WebDevFields data={data} set={set} />;
  if (service === "Logo Design")         return <LogoFields data={data} set={set} />;
  if (service === "Digital Marketing")   return <MarketingFields data={data} set={set} />;
  return null;
}

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FeaturesInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => (value || []).join(", "));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setText((value || []).join(", "));
    }
  }, [value]);

  return (
    <TextInput
      value={text}
      onFocus={() => { isFocused.current = true; }}
      onChange={(v) => {
        setText(v);
        onChange(v.split(",").map((s) => s.trim()).filter(Boolean));
      }}
      onBlur={() => {
        isFocused.current = false;
        const cleaned = text.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
        setText(cleaned);
        onChange(text.split(",").map((s) => s.trim()).filter(Boolean));
      }}
      placeholder={placeholder}
    />
  );
}

function AutomationFields({ data, set }: any) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Project overview" subtitle="What's the requirement?" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Requirement type">
            <Select
              value={data.requirementType || ""}
              onChange={(v) => set("requirementType", (v || undefined) as RequirementType)}
              options={[
                { value: "", label: "Select…" },
                { value: "Commodity", label: "Commodity" },
                { value: "Service", label: "Service" },
              ]}
            />
          </Field>
          <Field label="Project title">
            <TextInput value={data.projectTitle || ""} onChange={(v) => set("projectTitle", v)} placeholder="e.g. Invoice automation bot" />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Project goals">
            <TextArea value={data.projectGoals || ""} onChange={(v) => set("projectGoals", v)} placeholder="What should this automation achieve?" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Number Of Users">
              <TextInput
                value={data.targetAudience || ""}
                onChange={(v) => set("targetAudience", v.replace(/[^0-9]/g, ""))}
                placeholder="Enter number of users"
              />
            </Field>
            <Field label="Existing website">
              <TextInput value={data.existingWebsite || ""} onChange={(v) => set("existingWebsite", v)} placeholder="https://…" />
            </Field>
          </div>
        </div>
      </div>

      {data.requirementType === "Commodity" && (
        <div>
          <SectionHeader title="Commodity details" />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Commodity type">
              <TextInput value={data.commodityType || ""} onChange={(v) => set("commodityType", v)} />
            </Field>
            <Field label="Commodity name">
              <TextInput value={data.commodityName || ""} onChange={(v) => set("commodityName", v)} />
            </Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Features (comma separated)">
              <FeaturesInput
                value={data.commodityFeatures}
                onChange={(v) => set("commodityFeatures", v)}
                placeholder="Feature A, Feature B, Feature C"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Delivery terms">
                <TextInput value={data.commodityDelivery || ""} onChange={(v) => set("commodityDelivery", v)} />
              </Field>
              <Field label="References">
                <TextInput value={data.commodityRefs || ""} onChange={(v) => set("commodityRefs", v)} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {data.requirementType === "Service" && (
        <div>
          <SectionHeader title="Service details" />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Service type">
              <TextInput value={data.serviceType || ""} onChange={(v) => set("serviceType", v)} />
            </Field>
            <Field label="Timeline">
              <TextInput value={data.timeline || ""} onChange={(v) => set("timeline", v)} placeholder="e.g. 4 weeks" />
            </Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field label="Project description">
              <TextArea value={data.projectDescription || ""} onChange={(v) => set("projectDescription", v)} />
            </Field>
            <Field label="Service features (comma separated)">
              <FeaturesInput
                value={data.serviceFeatures}
                onChange={(v) => set("serviceFeatures", v)}
              />
            </Field>
            <Field label="References">
              <TextInput value={data.serviceRefs || ""} onChange={(v) => set("serviceRefs", v)} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function WebDevFields({ data, set }: any) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Project" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Project title">
            <TextInput value={data.projectTitle || ""} onChange={(v) => set("projectTitle", v)} />
          </Field>
          <Field label="Existing website">
            <TextInput value={data.existingWebsite || ""} onChange={(v) => set("existingWebsite", v)} placeholder="https://…" />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Project goals">
            <TextArea value={data.projectGoals || ""} onChange={(v) => set("projectGoals", v)} />
          </Field>
          <Field label="Number Of Users">
            <TextInput
              value={data.targetAudience || ""}
              onChange={(v) => set("targetAudience", v.replace(/[^0-9]/g, ""))}
              placeholder="Enter number of users"
            />
          </Field>
        </div>
      </div>
      <div>
        <SectionHeader title="Website details" />
        <div className="mt-4 space-y-4">
          <Field label="Pages needed">
            <TextInput value={data.pagesNeeded || ""} onChange={(v) => set("pagesNeeded", v)} placeholder="Home, About, Services, Contact…" />
          </Field>
          <Field label="Features needed">
            <TextInput value={data.featuresNeeded || ""} onChange={(v) => set("featuresNeeded", v)} placeholder="CMS, e-commerce, blog…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Website goal">
              <TextInput value={data.websiteGoal || ""} onChange={(v) => set("websiteGoal", v)} />
            </Field>
            <Field label="Launch date">
              <DateInput value={data.launchDate || ""} onChange={(v) => set("launchDate", v)} />
            </Field>
          </div>
          <Field label="Reference websites">
            <TextInput value={data.referenceWebsites || ""} onChange={(v) => set("referenceWebsites", v)} />
          </Field>
          <Field label="Additional suggestions">
            <TextArea value={data.additionalSuggestions || ""} onChange={(v) => set("additionalSuggestions", v)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function LogoFields({ data, set }: any) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Brand" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand name"><TextInput value={data.brandName || ""} onChange={(v) => set("brandName", v)} /></Field>
          <Field label="Tagline"><TextInput value={data.tagline || ""} onChange={(v) => set("tagline", v)} /></Field>
          <Field label="Nature of business"><TextInput value={data.natureOfBusiness || ""} onChange={(v) => set("natureOfBusiness", v)} /></Field>
          <Field label="Logo type"><TextInput value={data.logoType || ""} onChange={(v) => set("logoType", v)} placeholder="Wordmark, icon, combination…" /></Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Business description"><TextArea value={data.businessDescription || ""} onChange={(v) => set("businessDescription", v)} /></Field>
          <Field label="USP"><TextInput value={data.usp || ""} onChange={(v) => set("usp", v)} placeholder="What makes them unique?" /></Field>
        </div>
      </div>
      <div>
        <SectionHeader title="Design preferences" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Color preferences"><TextInput value={data.colorPreferences || ""} onChange={(v) => set("colorPreferences", v)} placeholder="Blue, gold, minimal…" /></Field>
          <Field label="Liked logos"><TextInput value={data.likedLogos || ""} onChange={(v) => set("likedLogos", v)} /></Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Competitor branding"><TextInput value={data.competitorBranding || ""} onChange={(v) => set("competitorBranding", v)} /></Field>
          <Field label="Audience detail"><TextInput value={data.audienceDetail || ""} onChange={(v) => set("audienceDetail", v)} /></Field>
          <Field label="Logo message"><TextArea value={data.logoMessage || ""} onChange={(v) => set("logoMessage", v)} /></Field>
        </div>
      </div>
    </div>
  );
}

function MarketingFields({ data, set }: any) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Business" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand name"><TextInput value={data.brandName || ""} onChange={(v) => set("brandName", v)} /></Field>
          <Field label="Nature of business"><TextInput value={data.natureOfBusiness || ""} onChange={(v) => set("natureOfBusiness", v)} /></Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Business activities"><TextArea value={data.businessActivities || ""} onChange={(v) => set("businessActivities", v)} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Major clients"><TextInput value={data.majorClients || ""} onChange={(v) => set("majorClients", v)} /></Field>
            <Field label="Country-wise market"><TextInput value={data.countryWiseMarket || ""} onChange={(v) => set("countryWiseMarket", v)} /></Field>
          </div>
          <Field label="Target audience (full)"><TextArea value={data.targetAudienceFull || ""} onChange={(v) => set("targetAudienceFull", v)} /></Field>
          <Field label="Business keywords (up to 50)"><TextArea value={data.businessKeywords50 || ""} onChange={(v) => set("businessKeywords50", v)} /></Field>
        </div>
      </div>
      <div>
        <SectionHeader title="Products" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Total products"><NumberInput value={data.totalProducts || ""} onChange={(v) => set("totalProducts", v)} min={0} step={1} placeholder="e.g. 120" /></Field>
          <Field label="Top-rated products"><NumberInput value={data.topRatedProducts || ""} onChange={(v) => set("topRatedProducts", v)} min={0} step={1} /></Field>
          <Field label="Top product keywords"><TextInput value={data.topProductKeywords || ""} onChange={(v) => set("topProductKeywords", v)} /></Field>
          <Field label="Important page / product"><TextInput value={data.importantPageOrProduct || ""} onChange={(v) => set("importantPageOrProduct", v)} /></Field>
        </div>
      </div>
      <div>
        <SectionHeader title="Assets & credentials" />
        <div className="mt-4 space-y-4">
          <Field label="Social media credentials"><TextArea value={data.socialMediaCredentials || ""} onChange={(v) => set("socialMediaCredentials", v)} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sample banners"><TextInput value={data.sampleBanners || ""} onChange={(v) => set("sampleBanners", v)} /></Field>
            <Field label="Sample blogs"><TextInput value={data.sampleBlogs || ""} onChange={(v) => set("sampleBlogs", v)} /></Field>
            <Field label="Sample copywriting"><TextInput value={data.sampleCopywriting || ""} onChange={(v) => set("sampleCopywriting", v)} /></Field>
            <Field label="GSC details"><TextInput value={data.gscDetails || ""} onChange={(v) => set("gscDetails", v)} /></Field>
          </div>
        </div>
      </div>
      <div>
        <SectionHeader title="SEO & links" />
        <div className="mt-4 space-y-4">
          <Field label="Dynamic URL recommendations"><TextInput value={data.dynamicUrlRecs || ""} onChange={(v) => set("dynamicUrlRecs", v)} /></Field>
          <Field label="Existing search submissions"><TextInput value={data.existingSearchSubmissions || ""} onChange={(v) => set("existingSearchSubmissions", v)} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Relevant links"><TextInput value={data.relevantLink || ""} onChange={(v) => set("relevantLink", v)} /></Field>
            <Field label="Community engagements"><TextInput value={data.communityEngagements || ""} onChange={(v) => set("communityEngagements", v)} /></Field>
            <Field label="SERP positioning"><TextInput value={data.serpPositioning || ""} onChange={(v) => set("serpPositioning", v)} /></Field>
          </div>
          <Field label="Competitor names / URLs"><TextArea value={data.competitorNamesUrls || ""} onChange={(v) => set("competitorNamesUrls", v)} /></Field>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Step 3 — Attachments ─────────────── */
function StepAttachments({
  value, onChange,
}: { value: LeadAttachment[]; onChange: (v: LeadAttachment[]) => void }) {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Extra content"
        subtitle="Attach PDFs, Word docs, or spreadsheets related to this lead."
      />
      <FileUpload attachments={value} onChange={onChange} />
    </div>
  );
}

/* ─────────────── Step 4 — Review ─────────────── */
function StepReview({
  data, service, consultantName, set, attachments,
}: {
  data: Partial<InquiryData>;
  service?: ServiceCategory;
  consultantName: string;
  set: <K extends keyof InquiryData>(k: K, v: InquiryData[K]) => void;
  attachments: LeadAttachment[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Contact preferences" subtitle="How should we reach them?" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Preferred contact method">
            <Select
              value={data.preferredContactMethod || ""}
              onChange={(v) => set("preferredContactMethod", v)}
              options={[{ value: "", label: "Select…" }, ...CONTACT_METHODS.map((m) => ({ value: m, label: m }))]}
            />
          </Field>
          <Field label="Preferred contact time">
            <TextInput value={data.preferredContactTime || ""} onChange={(v) => set("preferredContactTime", v)} placeholder="e.g. 10am–4pm IST" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Additional notes">
            <TextArea value={data.additionalNotes || ""} onChange={(v) => set("additionalNotes", v)} placeholder="Anything else the team should know?" />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-5">
        <SectionHeader title="Review" subtitle="Confirm before saving." />
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Summary label="Service" value={service || "—"} />
          <Summary label="Created by" value={consultantName} highlight />
          <Summary label="Client" value={data.fullName || "—"} />
          <Summary label="Type" value={data.clientType || "—"} />
          <Summary label="Email" value={data.email || "—"} />
          <Summary label="Phone" value={data.phone || "—"} />
          <Summary label="Country" value={data.country || "—"} />
          <Summary label="Location" value={data.location || "—"} />
          <Summary label="Company" value={data.companyName || "—"} />
          <Summary label="Job Title" value={data.jobTitle || "—"} />
          <Summary label="Designation" value={data.designation || "—"} />
          <Summary label="Website" value={data.companyWebsite || "—"} />

          {/* ✅ Social links list */}
          <div className="flex flex-col">
            <dt className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Social Links</dt>
            <dd className="mt-0.5 text-stone-800">
              {data.socialLinks && data.socialLinks.length > 0 ? (
                <ul className="space-y-0.5">
                  {data.socialLinks.map((l, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{l.name || "—"}:</span>{" "}
                      <span className="break-all">{l.url || "—"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <Summary label="Requirements" value={data.clientRequirements || "—"} />
          <Summary label="Attachments" value={`${attachments.length} file(s)`} />
          <Summary
            label="Lead Created"
            value={data.leadCreatedAt ? new Date(data.leadCreatedAt).toLocaleString() : "—"}
          />
        </dl>
      </div>
    </div>
  );
}

/* ─────────────── UI primitives ─────────────── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

const inputBase = "w-full px-3.5 py-2.5 text-sm text-stone-900 bg-white rounded-lg border transition-colors placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500";

function TextInput({ value, onChange, onBlur, onFocus, placeholder, type = "text", autoFocus }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`${inputBase} border-stone-300 hover:border-stone-400`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputBase} border-stone-300 hover:border-stone-400 resize-y min-h-20`}
    />
  );
}

function NumberInput({ value, onChange, min, max, step = 1, placeholder }: {
  value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number; placeholder?: string;
}) {
  const sanitize = (raw: string) => {
    let s = raw.replace(/[^\d.-]/g, "");
    if ((min ?? 0) >= 0) s = s.replace(/-/g, "");
    return s;
  };
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(sanitize(e.target.value))}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={`${inputBase} border-stone-300 hover:border-stone-400 tabular-nums`}
    />
  );
}

function DateInput({ value, onChange, min, max }: {
  value: string; onChange: (v: string) => void; min?: string; max?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} border-stone-300 hover:border-stone-400`}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select…" }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  const commit = (idx: number) => {
    const o = options[idx];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`w-full px-3.5 py-2.5 text-sm text-left rounded-lg border bg-white transition-colors flex items-center justify-between gap-2 ${
          open ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-stone-300 hover:border-stone-400"
        }`}
      >
        <span className={selected ? "text-stone-900" : "text-stone-400"}>{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, options.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); commit(highlight); }
            else if (e.key === "Escape") { setOpen(false); }
          }}
          tabIndex={-1}
        >
          {options.map((o, i) => {
            const isActive = i === highlight;
            const isSelected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(i)}
                className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-900" : "text-stone-700"
                }`}
              >
                <span>{o.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setHighlight(0);
  }, [query, open]);

  const commit = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapRef} className="relative">
          <input
        ref={inputRef}
        value={open ? query : value}
        onChange={(e) => {
          const val = e.target.value;
          if (!open) setOpen(true);
          setQuery(val);
          // ✅ UPDATE PARENT IMMEDIATELY AS THEY TYPE
          onChange(val); 
        }}
        onFocus={() => {
          setOpen(true);
          // Seed query with current value so the filter starts from what's selected
          setQuery(value ? "" : "");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            // If a filtered option is highlighted, pick it; else allow free-text
            if (open && filtered[highlight]) commit(filtered[highlight]);
            else if (query.trim()) commit(query.trim());
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
               onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        placeholder={placeholder}
        className={`${inputBase} border-stone-300 hover:border-stone-400 ${
          open ? "border-indigo-500 ring-2 ring-indigo-500/30" : ""
        }`}
      />
      <svg
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5">
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-stone-400">No matches</p>
          ) : (
            filtered.map((opt, i) => {
              const isActive = i === highlight;
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(opt)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                    isActive ? "bg-indigo-50 text-indigo-900" : "text-stone-700"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-indigo-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ✅ NEW: Social Links — dropdown for platform + custom option */
function SocialLinksInput({
  value,
  onChange,
}: {
  value: SocialLink[] | undefined;
  onChange: (v: SocialLink[]) => void;
}) {
  const links = value || [];

  const updateLink = (idx: number, patch: Partial<SocialLink>) => {
    const next = links.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange(next);
  };

  const addLink = () => {
    onChange([...links, { name: "", url: "" }]);
  };

  const removeLink = (idx: number) => {
    onChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {links.length === 0 && (
        <p className="text-xs text-stone-400 italic">No social links added yet.</p>
      )}

      {links.map((link, idx) => (
        <div key={idx} className="flex items-start gap-2">
          {/* Platform dropdown */}
          <div className="w-40 shrink-0">
            <Select
              value={link.name}
              onChange={(v) => {
                if (v === "Other") {
                  updateLink(idx, { name: "" });
                } else {
                  updateLink(idx, { name: v });
                }
              }}
              options={[
                { value: "", label: "Select…" },
                ...SOCIAL_PLATFORMS.map((p) => ({ value: p, label: p })),
              ]}
            />
            {/* Custom name input when "Other" or empty chosen */}
            {(link.name === "" || link.name === "Other") && (
              <input
                value={link.name === "Other" ? "" : link.name}
                onChange={(e) => updateLink(idx, { name: e.target.value })}
                placeholder="Custom name"
                className={`${inputBase} border-stone-300 hover:border-stone-400 mt-1.5`}
              />
            )}
          </div>

          {/* URL input */}
          <input
            value={link.url}
            onChange={(e) => updateLink(idx, { url: e.target.value })}
            placeholder="https://…"
            className={`${inputBase} border-stone-300 hover:border-stone-400 flex-1`}
          />

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeLink(idx)}
            aria-label="Remove link"
            className="shrink-0 p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addLink}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add social link
      </button>
    </div>
  );
}

function Summary({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">{label}</dt>
      <dd className={`mt-0.5 ${highlight ? "font-semibold text-indigo-700" : "text-stone-800"}`}>{value}</dd>
    </div>
  );
}