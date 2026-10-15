"use client";
import { useState } from "react";
import { InquiryDoc } from "@/lib/types";

type ServiceFilter =
  | "All"
  | "Automation Software"
  | "Web Development"
  | "Logo Design"
  | "Digital Marketing";

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ServiceFilter>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InquiryDoc | null>(null);

  // ---------- LOGIN ----------
  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/inquiries", {
        headers: { "x-admin-password": password },
      });
      if (res.status === 401) {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setInquiries(json.inquiries);
        setAuthed(true);
      } else {
        setError(json.error || "Failed to load");
      }
    } catch (e: any) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- ACTIONS ----------
  const refresh = async () => {
    const res = await fetch("/api/admin/inquiries", {
      headers: { "x-admin-password": password },
    });
    const json = await res.json();
    if (json.success) setInquiries(json.inquiries);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this inquiry permanently?")) return;
    const res = await fetch(`/api/admin/inquiries?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const json = await res.json();
    if (json.success) {
      setInquiries((prev) => prev.filter((i) => i._id !== id));
      setSelected(null);
    }
  };

  // ================= LOGIN SCREEN =================
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9] relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-100/40 blur-[100px]" />
        </div>

        <div className="w-full max-w-[400px] relative animate-[fadeIn_0.5s_ease-out]">
          <div className="flex flex-col items-center mb-9">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-900/20 ring-1 ring-indigo-900/10">
              <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-[24px] font-semibold text-stone-900 mt-6 tracking-tight">
              Admin Console
            </h1>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Sign in to manage client inquiries
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-8px_rgba(0,0,0,0.06)] p-6">
            <label className="block text-[11px] font-semibold text-stone-700 mb-2 tracking-[0.08em] uppercase">
              Access Key
            </label>
            <input
              type="password"
              className="w-full px-3.5 py-3 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-200 hover:border-stone-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              autoFocus
            />

            {error && (
              <div className="mt-3 flex items-center gap-2 text-rose-700 text-[12px] bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={login}
              disabled={loading || !password}
              className="group mt-5 w-full px-5 py-3 rounded-lg font-semibold text-[13px] text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-stone-400 mt-6 tracking-wide">
            Authorized access only · Activity is logged
          </p>
        </div>
      </main>
    );
  }

  // ================= DASHBOARD =================
  const filtered = inquiries.filter((i) => {
    if (filter !== "All" && i.serviceCategory !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.fullName?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.phone?.toLowerCase().includes(q) ||
        i.consultantName?.toLowerCase().includes(q) ||
        i.companyName?.toLowerCase().includes(q) ||
        i.projectTitle?.toLowerCase().includes(q) ||
        i.brandName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = inquiries.length;
  const automationCount = inquiries.filter((i) => i.serviceCategory === "Automation Software").length;
  const webCount = inquiries.filter((i) => i.serviceCategory === "Web Development").length;
  const logoCount = inquiries.filter((i) => i.serviceCategory === "Logo Design").length;
  const marketingCount = inquiries.filter((i) => i.serviceCategory === "Digital Marketing").length;

  return (
    <main className="min-h-screen bg-[#fafaf9] text-stone-900">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-8 lg:py-10">
        {/* ===== HEADER ===== */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-9">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center ring-1 ring-indigo-900/10 shadow-md shadow-indigo-900/10">
              <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[19px] sm:text-[21px] font-semibold text-stone-900 tracking-tight">
                  Inquiries
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[13px] text-stone-500 mt-0.5">
                {total} {total === 1 ? "submission" : "submissions"} · Updated just now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="group px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180 text-stone-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <a
              href="/"
              className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium text-white bg-stone-900 hover:bg-stone-800 transition-all duration-200 shadow-sm"
            >
              Public Form
            </a>
          </div>
        </header>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-7">
          <StatCard label="Total" value={total} accent="stone" featured />
          <StatCard label="Automation" value={automationCount} accent="violet" />
          <StatCard label="Web Dev" value={webCount} accent="sky" />
          <StatCard label="Logo" value={logoCount} accent="amber" />
          <StatCard label="Marketing" value={marketingCount} accent="emerald" />
        </div>

        {/* ===== FILTERS ===== */}
        <div className="rounded-xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-3 mb-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-200 hover:border-stone-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white"
              placeholder="Search by name, email, phone, consultant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-stone-100/80 border border-stone-200/60">
            {(
              [
                "All",
                "Automation Software",
                "Web Development",
                "Logo Design",
                "Digital Marketing",
              ] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 whitespace-nowrap ${
                  filter === f
                    ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200"
                    : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                }`}
              >
                {f === "Automation Software" ? "Automation" : f === "Web Development" ? "Web" : f === "Digital Marketing" ? "Marketing" : f}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TABLE ===== */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1050px]">
                <thead>
                  <tr className="text-left bg-stone-50/80 border-b border-stone-200">
                    {["Name", "Consultant", "Email", "Phone", "Company", "Service", "Sub-Type", "Project", "Date", ""].map((h, idx) => (
                      <th
                        key={idx}
                        className={`px-5 py-3.5 text-[10.5px] font-semibold text-stone-500 uppercase tracking-[0.1em] ${idx === 9 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((i) => (
                    <tr
                      key={i._id}
                      className="hover:bg-stone-50/60 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-[11px] font-semibold text-stone-700 shrink-0">
                            {i.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-stone-900 text-[13.5px]">{i.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {i.consultantName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-stone-600 text-[13px]">{i.email}</td>
                      <td className="px-5 py-3.5 text-stone-600 text-[13px] whitespace-nowrap">{i.phone}</td>
                      <td className="px-5 py-3.5 text-stone-600 text-[13px]">{i.companyName || <span className="text-stone-300">—</span>}</td>
                      <td className="px-5 py-3.5">
                        <ServiceBadge category={i.serviceCategory} />
                      </td>
                      <td className="px-5 py-3.5">
                        {i.serviceCategory === "Automation Software" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border ${
                              i.requirementType === "Commodity"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-pink-50 text-pink-700 border-pink-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                i.requirementType === "Commodity" ? "bg-sky-500" : "bg-pink-500"
                              }`}
                            />
                            {i.requirementType || "—"}
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-stone-600 text-[12.5px] truncate max-w-[160px]">
                        {i.projectTitle || i.commodityType || i.serviceType || <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-stone-500 text-[12px] whitespace-nowrap font-mono">
                        {new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelected(i)}
                          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-stone-600 hover:text-indigo-700 transition-colors duration-150 group/btn"
                        >
                          View
                          <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selected && (
        <div
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-2xl bg-white border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[fadeIn_0.25s_ease-out] shadow-2xl shadow-stone-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50/50">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shrink-0 ring-1 ring-indigo-900/10">
                  <span className="text-amber-300 font-semibold text-sm">
                    {selected.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-stone-900 truncate tracking-tight">
                    {selected.fullName}
                  </h2>
                  <p className="text-[12px] text-stone-500 font-mono mt-0.5">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
              <Section title="Service Requested">
                <Row label="Category" value={selected.serviceCategory || "—"} />
                {selected.serviceCategory === "Automation Software" && (
                  <Row label="Sub-Type" value={selected.requirementType || "—"} />
                )}
              </Section>

              <Section title="Contact Info">
                <Row label="Consultant" value={selected.consultantName || "—"} highlight />
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Client Type" value={selected.clientType} />
                {selected.companyName && <Row label="Company" value={selected.companyName} />}
                {selected.designation && <Row label="Designation" value={selected.designation} />}
              </Section>

              {(selected.projectTitle ||
                selected.projectGoals ||
                selected.targetAudience ||
                selected.existingWebsite ||
                selected.additionalNotes) && (
                <Section title="Project Info">
                  {selected.projectTitle && <Row label="Title" value={selected.projectTitle} />}
                  {selected.projectGoals && <Row label="Goals" value={selected.projectGoals} />}
                  {selected.targetAudience && <Row label="Audience" value={selected.targetAudience} />}
                  {selected.existingWebsite && <Row label="Existing Site" value={selected.existingWebsite} />}
                  {selected.additionalNotes && <Row label="Notes" value={selected.additionalNotes} />}
                </Section>
              )}

              {selected.serviceCategory === "Automation Software" &&
                selected.requirementType === "Commodity" && (
                  <Section title="Commodity Details">
                    {selected.commodityType && <Row label="Type" value={selected.commodityType} />}
                    {selected.commodityName && <Row label="Name" value={selected.commodityName} />}
                    {selected.commodityFeatures?.length ? (
                      <Row label="Features" value={selected.commodityFeatures.join(", ")} />
                    ) : null}
                    {selected.commodityDelivery && <Row label="Delivery" value={selected.commodityDelivery} />}
                    {selected.commodityRefs && <Row label="References" value={selected.commodityRefs} />}
                  </Section>
                )}

              {selected.serviceCategory === "Automation Software" &&
                selected.requirementType === "Service" && (
                  <Section title="Service Details">
                    {selected.serviceType && <Row label="Service Type" value={selected.serviceType} />}
                    {selected.projectDescription && <Row label="Description" value={selected.projectDescription} />}
                    {selected.serviceFeatures?.length ? (
                      <Row label="Features" value={selected.serviceFeatures.join(", ")} />
                    ) : null}
                    {selected.timeline && <Row label="Timeline" value={selected.timeline} />}
                    {selected.serviceRefs && <Row label="References" value={selected.serviceRefs} />}
                  </Section>
                )}

              {selected.serviceCategory === "Logo Design" && (
                <Section title="Logo Design Brief">
                  {selected.audienceDetail && <Row label="Audience" value={selected.audienceDetail} />}
                  {selected.logoMessage && <Row label="Message / Emotion" value={selected.logoMessage} />}
                  {selected.likedLogos && <Row label="Liked Logos" value={selected.likedLogos} />}
                  {selected.logoType && <Row label="Logo Type" value={selected.logoType} />}
                  {selected.colorPreferences && <Row label="Colors" value={selected.colorPreferences} />}
                  {selected.tagline && <Row label="Tagline" value={selected.tagline} />}
                  {selected.competitorBranding && <Row label="Competitor Branding" value={selected.competitorBranding} />}
                </Section>
              )}

              {selected.serviceCategory === "Web Development" && (
                <Section title="Website Brief">
                  {selected.businessDescription && <Row label="Business Description" value={selected.businessDescription} />}
                  {selected.usp && <Row label="USP" value={selected.usp} />}
                  {selected.businessKeywords && <Row label="Keywords" value={selected.businessKeywords} />}
                  {selected.referenceWebsites && <Row label="Reference Sites" value={selected.referenceWebsites} />}
                  {selected.pagesNeeded && <Row label="Pages Needed" value={selected.pagesNeeded} />}
                  {selected.featuresNeeded && <Row label="Features Needed" value={selected.featuresNeeded} />}
                  {selected.websiteGoal && <Row label="Website Goal" value={selected.websiteGoal} />}
                  {selected.launchDate && <Row label="Launch Date" value={selected.launchDate} />}
                  {selected.additionalSuggestions && <Row label="Additional Suggestions" value={selected.additionalSuggestions} />}
                </Section>
              )}

              {selected.serviceCategory === "Digital Marketing" && (
                <>
                  <Section title="Brand Overview">
                    {selected.brandName && <Row label="Brand Name" value={selected.brandName} />}
                    {selected.natureOfBusiness && <Row label="Nature of Business" value={selected.natureOfBusiness} />}
                    {selected.businessActivities && <Row label="Business Activities" value={selected.businessActivities} />}
                    {selected.majorClients && <Row label="Major Clients" value={selected.majorClients} />}
                    {selected.countryWiseMarket && <Row label="Country-wise Market" value={selected.countryWiseMarket} />}
                    {selected.targetAudienceFull && <Row label="Target Audience" value={selected.targetAudienceFull} />}
                  </Section>

                  <Section title="Keywords & Products">
                    {selected.businessKeywords50 && <Row label="Business Keywords" value={selected.businessKeywords50} />}
                    {selected.totalProducts && <Row label="Total Products" value={selected.totalProducts} />}
                    {selected.topRatedProducts && <Row label="Top Rated Products" value={selected.topRatedProducts} />}
                    {selected.topProductKeywords && <Row label="Top Product Keywords" value={selected.topProductKeywords} />}
                    {selected.importantPageOrProduct && <Row label="Important Page / Product" value={selected.importantPageOrProduct} />}
                  </Section>

                  <Section title="Digital Presence">
                    {selected.socialMediaCredentials && <Row label="Social Media" value={selected.socialMediaCredentials} />}
                    {selected.sampleBanners && <Row label="Sample Banners" value={selected.sampleBanners} />}
                    {selected.sampleBlogs && <Row label="Sample Blogs" value={selected.sampleBlogs} />}
                    {selected.sampleCopywriting && <Row label="Sample Copywriting" value={selected.sampleCopywriting} />}
                    {selected.gscDetails && <Row label="GSC Details" value={selected.gscDetails} />}
                    {selected.dynamicUrlRecs && <Row label="Dynamic URL Recs" value={selected.dynamicUrlRecs} />}
                    {selected.existingSearchSubmissions && <Row label="Existing Search Submissions" value={selected.existingSearchSubmissions} />}
                    {selected.relevantLink && <Row label="Relevant Link" value={selected.relevantLink} />}
                    {selected.communityEngagements && <Row label="Community Engagements" value={selected.communityEngagements} />}
                    {selected.serpPositioning && <Row label="SERP Positioning" value={selected.serpPositioning} />}
                    {selected.competitorNamesUrls && <Row label="Competitors" value={selected.competitorNamesUrls} />}
                  </Section>
                </>
              )}

              {selected.preferredContactMethod && (
                <Section title="Preferences">
                  <Row label="Preferred Contact" value={selected.preferredContactMethod} />
                  {selected.preferredContactTime && <Row label="Contact Time" value={selected.preferredContactTime} />}
                </Section>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2.5 p-5 border-t border-stone-200 bg-stone-50/50">
              <button
                onClick={() => remove(selected._id)}
                className="px-4 py-2.5 rounded-lg text-[12.5px] font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <a
                href={`mailto:${selected.email}?subject=Re: Your Inquiry`}
                className="px-4 py-2.5 rounded-lg text-[12.5px] font-medium text-white bg-stone-900 hover:bg-stone-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================= SUB-COMPONENTS ================= */

function ServiceBadge({ category }: { category?: string }) {
  const config: Record<
    string,
    { bg: string; text: string; border: string; dot: string; label: string }
  > = {
    "Automation Software": {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      dot: "bg-violet-500",
      label: "Automation",
    },
    "Web Development": {
      bg: "bg-sky-50",
      text: "text-sky-700",
      border: "border-sky-200",
      dot: "bg-sky-500",
      label: "Web Dev",
    },
    "Logo Design": {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      label: "Logo",
    },
    "Digital Marketing": {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      label: "Marketing",
    },
  };

  const c = category && config[category] ? config[category] : null;

  if (!c) return <span className="text-stone-300 text-xs">—</span>;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
  featured,
}: {
  label: string;
  value: number;
  accent: "stone" | "violet" | "sky" | "amber" | "emerald";
  featured?: boolean;
}) {
  const styles = {
    stone: { text: "text-stone-900", bg: "bg-white" },
    violet: { text: "text-violet-700", bg: "bg-white" },
    sky: { text: "text-sky-700", bg: "bg-white" },
    amber: { text: "text-amber-700", bg: "bg-white" },
    emerald: { text: "text-emerald-700", bg: "bg-white" },
  }[accent];

  return (
    <div
      className={`relative rounded-xl ${styles.bg} border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-4 transition-all duration-200 hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
        featured ? "col-span-2 lg:col-span-1" : ""
      }`}
    >
      <p className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-[0.12em] mb-2.5">
        {label}
      </p>
      <p className={`text-[26px] font-semibold ${styles.text} tracking-tight leading-none tabular-nums`}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-[0.14em] mb-2 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-indigo-500" />
        {title}
      </h3>
      <div className="rounded-lg bg-stone-50/70 border border-stone-200/80 divide-y divide-stone-200/70">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5">
      <span className="text-[12px] text-stone-500 font-medium">{label}</span>
      <span
        className={`col-span-2 text-[13px] break-words whitespace-pre-wrap ${
          highlight ? "text-violet-700 font-semibold" : "text-stone-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-16 text-center">
      <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-stone-900 font-semibold text-[14.5px] mb-1">No inquiries found</h3>
      <p className="text-[13px] text-stone-500 max-w-sm mx-auto">
        Submissions from the public form will appear here. Try adjusting your filters.
      </p>
    </div>
  );
}