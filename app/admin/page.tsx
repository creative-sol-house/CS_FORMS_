"use client";
import { useState } from "react";
import { InquiryDoc } from "@/lib/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"All" | "Product" | "Service">("All");
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
        setError("Wrong password");
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
    if (!confirm("Delete this inquiry?")) return;
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
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100">
        <div className="w-full max-w-md animate-[fadeIn_0.35s_ease-out]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 mt-5 tracking-tight">
              Admin Access
            </h1>
            <p className="text-sm text-slate-500 mt-1">Enter your password to continue</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-blue-100/70">
            <label className="block text-[12px] font-medium text-slate-600 mb-2 tracking-wide">
              Admin Password
            </label>
            <input
              type="password"
              className="w-full px-3.5 py-3 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              autoFocus
            />

            {error && (
              <div className="mt-3 flex items-center gap-2 text-pink-600 text-xs bg-pink-50 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={login}
              disabled={loading || !password}
              className="group mt-5 w-full px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                <>
                  Login
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Protected area · Authorized access only
          </p>
        </div>
      </main>
    );
  }

  // ================= DASHBOARD =================
  const filtered = inquiries.filter((i) => {
    if (filter !== "All" && i.requirementType !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.fullName?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.companyName?.toLowerCase().includes(q) ||
        i.projectTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = inquiries.length;
  const productCount = inquiries.filter((i) => i.requirementType === "Product").length;
  const serviceCount = inquiries.filter((i) => i.requirementType === "Service").length;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100">
      <div className="max-w-7xl mx-auto">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] sm:text-xl font-semibold text-slate-800 leading-tight tracking-tight">
                Inquiries Dashboard
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {total} total submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <a
              href="/"
              className="px-4 py-2.5 rounded-xl text-[12.5px] font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 transition-all duration-200"
            >
              View Form
            </a>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Inquiries"
            value={total}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            accent="blue"
          />
          <StatCard
            label="Product-based"
            value={productCount}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            accent="pink"
          />
          <StatCard
            label="Service-based"
            value={serviceCount}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            accent="indigo"
          />
        </div>

        {/* ===== FILTERS ===== */}
        <div className="rounded-2xl bg-white p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3 border border-blue-100/70">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-blue-50/60 text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 hover:bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Search name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 sm:gap-2 p-1 rounded-xl bg-blue-50/60">
            {(["All", "Product", "Service"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[12.5px] font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
                    : "text-slate-500 hover:text-blue-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TABLE ===== */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-2xl bg-white overflow-hidden border border-blue-100/70">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-left text-slate-500 text-[11px] uppercase tracking-widest bg-blue-50/50">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr
                      key={i._id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-800">{i.fullName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{i.email}</td>
                      <td className="px-4 py-3.5 text-slate-500">{i.phone}</td>
                      <td className="px-4 py-3.5 text-slate-600">{i.companyName || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            i.requirementType === "Product"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-pink-100 text-pink-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            i.requirementType === "Product" ? "bg-blue-500" : "bg-pink-500"
                          }`} />
                          {i.requirementType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 truncate max-w-[150px]">
                        {i.projectTitle || i.productType || i.serviceType || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelected(i)}
                          className="text-blue-600 hover:text-pink-600 text-[12.5px] font-medium transition-colors"
                        >
                          View →
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-3xl bg-white max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50/70 to-pink-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {selected.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-slate-800 truncate">
                    {selected.fullName}
                  </h2>
                  <p className="text-[12px] text-slate-500">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
              {/* Contact */}
              <Section title="Contact Info">
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Client Type" value={selected.clientType} />
                {selected.companyName && <Row label="Company" value={selected.companyName} />}
                {selected.designation && <Row label="Designation" value={selected.designation} />}
              </Section>

              {/* Product fields */}
              {selected.requirementType === "Product" && (
                <Section title="Product Details">
                  {selected.productType && <Row label="Product Type" value={selected.productType} />}
                  {selected.productName && <Row label="Product Name" value={selected.productName} />}
                  {selected.productFeatures?.length ? (
                    <Row label="Features" value={selected.productFeatures.join(", ")} />
                  ) : null}
                  {selected.productBudget && <Row label="Budget" value={selected.productBudget} />}
                  {selected.productDelivery && <Row label="Delivery" value={selected.productDelivery} />}
                  {selected.productRefs && <Row label="References" value={selected.productRefs} />}
                </Section>
              )}

              {/* Service fields */}
              {selected.requirementType === "Service" && (
                <Section title="Service Details">
                  {selected.serviceType && <Row label="Service Type" value={selected.serviceType} />}
                  {selected.projectDescription && (
                    <Row label="Description" value={selected.projectDescription} />
                  )}
                  {selected.techPreference?.length ? (
                    <Row label="Tech" value={selected.techPreference.join(", ")} />
                  ) : null}
                  {selected.pagesOrScreens && (
                    <Row label="Pages" value={String(selected.pagesOrScreens)} />
                  )}
                  {selected.serviceFeatures?.length ? (
                    <Row label="Features" value={selected.serviceFeatures.join(", ")} />
                  ) : null}
                  {selected.serviceBudget && <Row label="Budget" value={selected.serviceBudget} />}
                  {selected.timeline && <Row label="Timeline" value={selected.timeline} />}
                  {selected.serviceRefs && <Row label="References" value={selected.serviceRefs} />}
                </Section>
              )}

              {/* Project */}
              {(selected.projectTitle ||
                selected.projectGoals ||
                selected.targetAudience ||
                selected.existingWebsite ||
                selected.additionalNotes) && (
                <Section title="Project Info">
                  {selected.projectTitle && <Row label="Title" value={selected.projectTitle} />}
                  {selected.projectGoals && <Row label="Goals" value={selected.projectGoals} />}
                  {selected.targetAudience && (
                    <Row label="Audience" value={selected.targetAudience} />
                  )}
                  {selected.existingWebsite && (
                    <Row label="Existing Site" value={selected.existingWebsite} />
                  )}
                  {selected.additionalNotes && (
                    <Row label="Notes" value={selected.additionalNotes} />
                  )}
                </Section>
              )}

              {/* Preferences */}
              {selected.preferredContactMethod && (
                <Section title="Preferences">
                  <Row label="Preferred Contact" value={selected.preferredContactMethod} />
                  {selected.preferredContactTime && (
                    <Row label="Contact Time" value={selected.preferredContactTime} />
                  )}
                </Section>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-5 bg-blue-50/40">
              <button
                onClick={() => remove(selected._id)}
                className="px-4 py-2.5 rounded-xl text-[12.5px] font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <a
                href={`mailto:${selected.email}?subject=Re: Your Inquiry`}
                className="px-5 py-2.5 rounded-xl text-[12.5px] font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Reply
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "blue" | "pink" | "indigo";
}) {
  const styles = {
    blue: { bg: "bg-blue-50/70", iconBg: "bg-blue-500", text: "text-blue-600" },
    pink: { bg: "bg-pink-50/70", iconBg: "bg-pink-500", text: "text-pink-600" },
    indigo: { bg: "bg-indigo-50/70", iconBg: "bg-indigo-500", text: "text-indigo-600" },
  }[accent];

  return (
    <div className={`rounded-2xl ${styles.bg} p-4 sm:p-5 transition-all duration-200 hover:brightness-[0.98]`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <div className={`w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl sm:text-3xl font-semibold ${styles.text}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
        {title}
      </h3>
      <div className="rounded-2xl bg-blue-50/50 divide-y divide-blue-100">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-2.5">
      <span className="text-[12px] text-slate-500 font-medium">{label}</span>
      <span className="col-span-2 text-[13px] text-slate-700 break-words whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white border border-blue-100/70 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-slate-800 font-semibold mb-1">No inquiries yet</h3>
      <p className="text-sm text-slate-500">
        Submissions from the public form will appear here.
      </p>
    </div>
  );
}