"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_STYLES: Record<string, string> = {
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Not Interested": "bg-rose-100 text-rose-800 border-rose-200",
  Interested: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Call Back": "bg-amber-100 text-amber-800 border-amber-200",
  Pending: "bg-stone-200 text-stone-800 border-stone-300",
};

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const ACTION_META: Record<string, { color: string; icon: string; ring: string }> = {
  Created:     { color: "text-emerald-700", icon: "✨", ring: "ring-emerald-200 bg-emerald-50" },
  Update:      { color: "text-indigo-700",  icon: "⚙️", ring: "ring-indigo-200 bg-indigo-50" },
  Note:        { color: "text-amber-700",   icon: "📝", ring: "ring-amber-200 bg-amber-50" },
  Attachments: { color: "text-purple-700",  icon: "📎", ring: "ring-purple-200 bg-purple-50" },
  Call:        { color: "text-blue-700",    icon: "📞", ring: "ring-blue-200 bg-blue-50" },
  Meeting:     { color: "text-fuchsia-700", icon: "🤝", ring: "ring-fuchsia-200 bg-fuchsia-50" },
  Delete:      { color: "text-rose-700",    icon: "🗑️", ring: "ring-rose-200 bg-rose-50" },
};
function actionMeta(a: string) {
  return ACTION_META[a] || { color: "text-stone-700", icon: "•", ring: "ring-stone-200 bg-stone-50" };
}

function getLeadDisplayTitle(lead: any): string {
  const company = lead.companyName?.trim?.();
  if (lead.clientType === "Business" && company) return company;
  return lead.fullName || "Unnamed Lead";
}

export default function LeadAnalysisPanel({
  onUpdateLead,
}: {
  onUpdateLead?: (lead: any) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLead, setFetchingLead] = useState(false);

  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/admin/lead-analysis?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [from, to]);

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.leads;
    return data.leads.filter((l: any) => {
      const hay = [l.fullName, l.email, l.phone, l.companyName, l.serviceCategory, l.status, l.consultantName, l.assignedTo]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [data, query]);

  // ✅ FIX: Fully fetch the lead before editing so attachments aren't wiped
  const handleEditLead = async (lead: any) => {
    if (!onUpdateLead) return;
    setFetchingLead(true);
    try {
      const res = await fetch(`/api/admin/inquiries?focus=${lead._id}`);
      const json = await res.json();
      if (json.success && json.inquiries?.length > 0) {
        onUpdateLead(json.inquiries[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingLead(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-stone-500">Loading report...</div>;
  if (!data) return <div className="p-10 text-center text-rose-500">Failed to load report.</div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in">
      {/* ─── DATE FILTER ─── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">From</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">To</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </label>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {[
            { label: "7d", fn: () => { setFrom(daysAgoISO(7)); setTo(todayISO()); } },
            { label: "30d", fn: () => { setFrom(daysAgoISO(30)); setTo(todayISO()); } },
            { label: "90d", fn: () => { setFrom(daysAgoISO(90)); setTo(todayISO()); } },
            { label: "All", fn: () => { setFrom(""); setTo(""); } },
          ].map((p) => (
            <button
              key={p.label}
              onClick={p.fn}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 active:bg-stone-200 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Last {p.label === "All" ? "—" : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Leads" color="text-stone-500" value={data.totalLeads} />
        <KpiCard
          label="Conversion"
          color="text-emerald-600"
          value={`${data.conversionRate}%`}
          sub={`${data.approved} won`}
        />
        <KpiCard label="Calls" color="text-indigo-600" value={data.calls} />
        <KpiCard label="Meetings" color="text-purple-600" value={data.meetings} />
      </div>

      {/* ─── CHART + RECENT ACTIVITY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-3">Leads by Service</h3>
          <div className="h-56 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadsByService}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip cursor={{ fill: "#f5f5f4" }} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-3">Recent Calls & Meetings</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-stone-500">No follow-ups in this range.</p>
            ) : (
              data.recentActivity.map((act: any, i: number) => {
                const m = actionMeta(act.type);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const target = data.leads.find((l: any) => l._id === act.leadId);
                      if (target) setSelectedLead(target);
                    }}
                    className="w-full text-left flex items-start gap-3 p-3 active:bg-indigo-50 hover:bg-indigo-50/50 rounded-xl border border-stone-100 transition-colors"
                  >
                    <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-1 ${m.ring}`}>
                      <span className="text-base">{m.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800 truncate">
                        {act.leadName ? `[${act.leadName}] ` : ""}{act.note || `${act.type} logged`}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {new Date(act.date).toLocaleString()} · by {act.loggedBy}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── LEADS LIST ─── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-stone-800">Leads in range</h3>
            <span className="text-[11px] text-stone-500">
              {filteredLeads.length} of {data.leads.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="Search name, email, company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-500">No leads matched.</div>
        ) : (
          <>
            {/* MOBILE cards */}
            <ul className="lg:hidden divide-y divide-stone-100">
              {filteredLeads.map((lead: any) => (
                <li key={lead._id}>
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="w-full text-left px-4 py-3 active:bg-indigo-50 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-800 truncate flex items-center gap-1.5">
                          {getLeadDisplayTitle(lead)}
                          {lead.clientType === "Business" && (
                            <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200">
                              Business
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {lead.companyName ? `Contact: ${lead.fullName}` : lead.email}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${STATUS_STYLES[lead.status] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                      <span className="truncate">{lead.serviceCategory || "—"}</span>
                      <span>·</span>
                      <span className="truncate">{lead.assignedTo || "Unassigned"}</span>
                      <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        📋 {lead.auditLogs?.length || 0}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* DESKTOP table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                    <th className="text-left px-5 py-3">Client</th>
                    <th className="text-left px-3 py-3">Service</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Consultant</th>
                    <th className="text-left px-3 py-3">Assigned</th>
                    <th className="text-left px-3 py-3">Created</th>
                    <th className="text-left px-3 py-3">Logs</th>
                    <th className="text-right px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any) => (
                    <tr
                      key={lead._id}
                      className="border-b border-stone-100 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                          {getLeadDisplayTitle(lead)}
                          {lead.clientType === "Business" && (
                            <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-200">
                              Business
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {lead.companyName ? `Contact: ${lead.fullName}` : lead.email}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-stone-700">{lead.serviceCategory || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_STYLES[lead.status] || "bg-stone-100 text-stone-700 border-stone-200"}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-700">{lead.consultantName || "—"}</td>
                      <td className="px-3 py-3 text-stone-700">{lead.assignedTo || "Unassigned"}</td>
                      <td className="px-3 py-3 text-stone-500 text-[12px]">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block min-w-[26px] text-center px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {lead.auditLogs?.length || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-indigo-600 text-xs font-semibold">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedLead && (
        <LeadDrilldownDrawer
          lead={selectedLead}
          initialFrom={from}
          initialTo={to}
          onClose={() => setSelectedLead(null)}
          onEdit={onUpdateLead ? () => {
            setSelectedLead(null);
            handleEditLead(selectedLead);
          } : undefined}
          fetchingLead={fetchingLead}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DRILLDOWN DRAWER
   ════════════════════════════════════════════════════════════════════ */
function LeadDrilldownDrawer({
  lead,
  initialFrom,
  initialTo,
  onClose,
  onEdit,
  fetchingLead,
}: {
  lead: any;
  initialFrom: string;
  initialTo: string;
  onClose: () => void;
  onEdit?: () => void;
  fetchingLead?: boolean;
}) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [tab, setTab] = useState<"data" | "audit">("data");
  const [actionFilter, setActionFilter] = useState<string | "">("");

  // Lock body scroll on mobile while drawer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const logs = useMemo(() => {
    const all: any[] = lead.auditLogs || [];
    const fromT = from ? new Date(from).setHours(0, 0, 0, 0) : null;
    const toT = to ? new Date(to).setHours(23, 59, 59, 999) : null;
    const filtered = all.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      if (fromT !== null && t < fromT) return false;
      if (toT !== null && t > toT) return false;
      if (actionFilter && l.action !== actionFilter) return false;
      return true;
    });
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [lead.auditLogs, from, to, actionFilter]);

  const actionBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    (lead.auditLogs || []).forEach((l: any) => {
      const a = l.action || "Other";
      map[a] = (map[a] || 0) + 1;
    });
    return map;
  }, [lead.auditLogs]);

  const grouped = useMemo(() => {
    const groups: { date: string; items: any[] }[] = [];
    logs.forEach((l) => {
      const day = new Date(l.timestamp).toLocaleDateString(undefined, {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      });
      const last = groups[groups.length - 1];
      if (last && last.date === day) last.items.push(l);
      else groups.push({ date: day, items: [l] });
    });
    return groups;
  }, [logs]);

  const intl = lead.isInternationalClient || (lead.country && lead.country !== "Pakistan");
  const regionLabel = lead.clientRegion || (intl ? "International" : "Local");

  return (
    <div className="fixed inset-0 z-50 flex sm:justify-end">
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div
        className="
          relative w-full sm:max-w-2xl h-full
          bg-[#fafaf9] shadow-2xl flex flex-col
          animate-in slide-in-from-right duration-200
          sm:rounded-l-2xl overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="shrink-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white px-4 sm:px-5 pt-4 pb-3 sm:pb-4">
          {/* Mobile grab handle */}
          <div className="mx-auto w-10 h-1 bg-white/30 rounded-full mb-3 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Lead drilldown
              </p>
              <h2 className="text-lg sm:text-xl font-bold truncate mt-0.5 flex items-center gap-2">
                {getLeadDisplayTitle(lead)}
                {lead.clientType === "Business" && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-violet-400/20 text-violet-200 border border-violet-300/40">
                    Business
                  </span>
                )}
                {intl && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-300/40">
                    Intl
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5 truncate">
                {lead.companyName ? `Contact: ${lead.fullName}` : lead.email}
              </p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  disabled={fetchingLead}
                  className="p-2 rounded-full hover:bg-white/15 transition-colors disabled:opacity-50"
                  title="Edit Lead"
                >
                  {fetchingLead ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 -mr-1 rounded-full active:bg-white/15 hover:bg-white/15 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* TABS — big tap targets */}
          <div className="mt-3 grid grid-cols-2 gap-1 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setTab("data")}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === "data"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-white/80 active:bg-white/10"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setTab("audit")}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === "audit"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-white/80 active:bg-white/10"
              }`}
            >
              Audit ({lead.auditLogs?.length || 0})
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">
          {tab === "data" ? (
            <LeadDataView lead={lead} />
          ) : (
            <>
              {/* Drawer-local date filter */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">From</span>
                    <input
                      type="date"
                      value={from}
                      max={to}
                      onChange={(e) => setFrom(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">To</span>
                    <input
                      type="date"
                      value={to}
                      min={from}
                      onChange={(e) => setTo(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </label>
                </div>

                {(from || to || actionFilter) && (
                  <button
                    onClick={() => { setFrom(""); setTo(""); setActionFilter(""); }}
                    className="w-full py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 active:bg-stone-200 rounded-md transition-colors"
                  >
                    Clear filters
                  </button>
                )}

                {Object.keys(actionBreakdown).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip
                      active={actionFilter === ""}
                      onClick={() => setActionFilter("")}
                      label={`All (${lead.auditLogs?.length || 0})`}
                    />
                    {Object.entries(actionBreakdown).map(([action, count]) => (
                      <FilterChip
                        key={action}
                        active={actionFilter === action}
                        onClick={() => setActionFilter(action)}
                        label={`${actionMeta(action).icon} ${action} (${count})`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {logs.length === 0 ? (
                <div className="text-center py-12 text-sm text-stone-500 bg-white border border-stone-200 rounded-xl">
                  No audit entries match this filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map((group, gi) => (
                    <div key={gi}>
                      <div className="sticky top-0 z-10 bg-[#fafaf9]/95 backdrop-blur py-1.5 -mx-1 px-1 mb-1">
                        <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                          {group.date}
                        </p>
                      </div>
                      <ol className="relative ml-2 space-y-2">
                        {/* vertical line */}
                        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-stone-200" aria-hidden />
                        {group.items.map((log, i) => {
                          const m = actionMeta(log.action);
                          return (
                            <li key={i} className="relative pl-10">
                              <span
                                className={`absolute left-0 top-1 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] ring-4 ring-[#fafaf9] ${m.ring}`}
                              >
                                {m.icon}
                              </span>
                              <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-sm">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${m.ring} ${m.color}`}>
                                    {log.action}
                                  </span>
                                  <span className="text-[10px] text-stone-500 tabular-nums">
                                    {new Date(log.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit", minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-[13px] text-stone-800 mt-1.5 whitespace-pre-wrap leading-relaxed">
                                  {log.details}
                                </p>
                                <div className="flex items-center gap-2 mt-2.5">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-[10px] font-bold">
                                    {(log.performedBy || "?")[0].toUpperCase()}
                                  </span>
                                  <span className="text-[11px] text-stone-600 font-medium">
                                    {log.performedBy}
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Read-only lead data view ── */
function LeadDataView({ lead }: { lead: any }) {
  const intl = lead.isInternationalClient || (lead.country && lead.country !== "Pakistan");
  const regionLabel = lead.clientRegion || (intl ? "International" : "Local");

  return (
    <div className="space-y-3">
      <DataSection title="Client">
        <Row label="Full Name" value={lead.fullName} />
        <Row label="Email" value={lead.email} />
        <Row label="Phone" value={lead.phone} />
        <Row label="Client Type" value={lead.clientType} />
        <Row label="Company" value={lead.companyName} />
        <Row label="Designation" value={lead.designation} />
        <Row label="Country" value={lead.country} />
        <Row label="Region" value={regionLabel} />
      </DataSection>

      {lead.socialLinks && lead.socialLinks.length > 0 && (
        <DataSection title="Social Links">
          <div className="flex flex-wrap gap-2">
            {lead.socialLinks.map((l: any, i: number) => (
              <a
                key={i}
                href={l.url?.startsWith("http") ? l.url : `https://${l.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
              >
                <span className="text-[11px] font-semibold text-stone-700">{l.name || "Link"}</span>
              </a>
            ))}
          </div>
        </DataSection>
      )}

      <DataSection title="Ownership">
        <Row label="Consultant" value={lead.consultantName} />
        <Row label="Assigned To" value={lead.assignedTo || "Unassigned"} />
        <Row label="Status" value={lead.status} />
        <Row label="Created" value={new Date(lead.createdAt).toLocaleString()} />
        <Row label="Last Updated" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : undefined} />
      </DataSection>

      <DataSection title="Service & Project">
        <Row label="Category" value={lead.serviceCategory} />
        <Row label="Requirement Type" value={lead.requirementType} />
        <Row label="Project Title" value={lead.projectTitle} />
        <Row label="Project Goals" value={lead.projectGoals} />
        <Row label="Target Audience" value={lead.targetAudience || lead.targetAudienceFull} />
        <Row label="Existing Website" value={lead.existingWebsite} />
        <Row label="Timeline" value={lead.timeline} />
        <Row label="Launch Date" value={lead.launchDate} />
        <Row label="Website Goal" value={lead.websiteGoal} />
        <Row label="Pages Needed" value={lead.pagesNeeded} />
        <Row label="Features Needed" value={lead.featuresNeeded} />
      </DataSection>

      {lead.serviceCategory === "Logo Design" && (
        <DataSection title="Logo Design">
          <Row label="Brand Name" value={lead.brandName} />
          <Row label="Tagline" value={lead.tagline} />
          <Row label="Nature of Business" value={lead.natureOfBusiness} />
          <Row label="Logo Type" value={lead.logoType} />
          <Row label="Color Preferences" value={lead.colorPreferences} />
          <Row label="Liked Logos" value={lead.likedLogos} />
          <Row label="Competitor Branding" value={lead.competitorBranding} />
          <Row label="USP" value={lead.usp} />
          <Row label="Logo Message" value={lead.logoMessage} />
        </DataSection>
      )}

      {lead.serviceCategory === "Digital Marketing" && (
        <DataSection title="Digital Marketing">
          <Row label="Brand Name" value={lead.brandName} />
          <Row label="Business Activities" value={lead.businessActivities} />
          <Row label="Major Clients" value={lead.majorClients} />
          <Row label="Country-wise Market" value={lead.countryWiseMarket} />
          <Row label="Total Products" value={lead.totalProducts} />
          <Row label="Top-Rated Products" value={lead.topRatedProducts} />
          <Row label="Top Product Keywords" value={lead.topProductKeywords} />
          <Row label="GSC Details" value={lead.gscDetails} />
          <Row label="Competitor Names / URLs" value={lead.competitorNamesUrls} />
        </DataSection>
      )}

      <DataSection title="Contact Preferences">
        <Row label="Preferred Method" value={lead.preferredContactMethod} />
        <Row label="Preferred Time" value={lead.preferredContactTime} />
        <Row label="Additional Notes" value={lead.additionalNotes} />
      </DataSection>

      {lead.notes && (
        <DataSection title="Internal Notes">
          <div className="text-[13px] text-stone-800 whitespace-pre-wrap leading-relaxed bg-amber-50 border border-amber-200 rounded-md p-3">
            {lead.notes}
          </div>
        </DataSection>
      )}

      {Array.isArray(lead.attachments) && lead.attachments.length > 0 && (
        <DataSection title={`Attachments (${lead.attachments.length})`}>
          <ul className="space-y-1.5">
            {lead.attachments.map((f: any, i: number) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-stone-50 border border-stone-200 text-sm"
              >
                <span className="truncate text-stone-800">{f.fileName}</span>
                <span className="text-[11px] text-stone-500 shrink-0">
                  {formatBytes(f.fileSize)}
                </span>
              </li>
            ))}
          </ul>
        </DataSection>
      )}
    </div>
  );
}

/* ─── Shared UI ─── */
function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border transition-colors ${
        active
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-white text-stone-700 border-stone-300 active:bg-stone-100 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({
  label, value, sub, color,
}: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1 ${color}`}>{label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-stone-800 leading-tight">{value}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1">{sub}</p>}
    </div>
  );
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 px-1">{title}</h3>
      <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="text-stone-500 shrink-0">{label}</span>
      <span className="text-stone-800 text-right break-words font-medium">{String(value)}</span>
    </div>
  );
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}