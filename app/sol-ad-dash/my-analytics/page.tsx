"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InquiryDoc } from "@/lib/types";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Constants (unchanged from your admin panel) ─────────────
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Interested: "#4f46e5",
  Pending: "#f59e0b",
  "Call Back": "#8b5cf6",
  "Not Interested": "#ef4444",
};

const STATUSES = ["Pending", "Interested", "Call Back", "Approved", "Not Interested"] as const;
const SERVICES = ["Automation Software", "Web Development", "Logo Design", "Digital Marketing"] as const;

type SourceFilter = "All" | "Created" | "Assigned" | "Both";
type PresetKey = "all" | "today" | "week" | "month" | "lastMonth" | "custom";

// ── Date helpers ────────────────────────────────────────────
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

function getPresetRange(preset: PresetKey): { from: string; to: string } {
  const now = new Date();
  if (preset === "today") {
    return {
      from: startOfDay(now).toISOString().slice(0, 10),
      to: endOfDay(now).toISOString().slice(0, 10),
    };
  }
  if (preset === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return {
      from: startOfDay(monday).toISOString().slice(0, 10),
      to: endOfDay(now).toISOString().slice(0, 10),
    };
  }
  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: startOfDay(first).toISOString().slice(0, 10),
      to: endOfDay(now).toISOString().slice(0, 10),
    };
  }
  if (preset === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: startOfDay(first).toISOString().slice(0, 10),
      to: endOfDay(last).toISOString().slice(0, 10),
    };
  }
  return { from: "", to: "" };
}

// ── Types matching the API response ─────────────────────────
type Me = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

type Stats = {
  createdCount: number;
  assignedCount: number;
  bothCount: number;
  total: number;
  statusCounts: Record<string, number>;
  conversionRate: number;
};

type ApiResponse = {
  success: boolean;
  me: Me;
  stats: Stats;
  leads: any[];
  createdLeads: any[];
  assignedLeads: any[];
  error?: string;
};

export default function MyAnalyticsPage() {
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [leads, setLeads] = useState<any[]>([]);

  // ── Filters ───────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [serviceFilter, setServiceFilter] = useState<string>("All");
  const [preset, setPreset] = useState<PresetKey>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [month, setMonth] = useState("");

  // ── Fetch ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my-analytics", { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load analytics");
      }

      setMe(data.me);
      setLeads(data.leads);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync preset → dateFrom/dateTo
  useEffect(() => {
    if (preset === "custom" || preset === "all") return;
    const { from, to } = getPresetRange(preset);
    setDateFrom(from);
    setDateTo(to);
    setMonth("");
  }, [preset]);

  // ── Classify each lead relative to ME only ────────────
  const classifyLead = useCallback(
    (l: any): "Created" | "Assigned" | "Both" => {
      if (!me) return "Assigned";
      const createdByMe =
        (l.createdById && l.createdById === me._id) ||
        (l.createdBy && l.createdBy === me.name);
      const assignedToMe = l.assignedTo && l.assignedTo === me.name;
      if (createdByMe && assignedToMe) return "Both";
      if (createdByMe) return "Created";
      return "Assigned";
    },
    [me]
  );

  // ── Filter pipeline ───────────────────────────────────
  const filteredLeads = useMemo(() => {
    let rows = [...leads];

    if (sourceFilter !== "All") {
      rows = rows.filter((l) => classifyLead(l) === sourceFilter);
    }
    if (statusFilter !== "All") {
      rows = rows.filter((l) => l.status === statusFilter);
    }
    if (serviceFilter !== "All") {
      rows = rows.filter((l) => l.serviceCategory === serviceFilter);
    }

    if (month) {
      const [y, m] = month.split("-").map(Number);
      rows = rows.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    } else {
      if (dateFrom) {
        const f = new Date(dateFrom).setHours(0, 0, 0, 0);
        rows = rows.filter((l) => new Date(l.createdAt).getTime() >= f);
      }
      if (dateTo) {
        const t = new Date(dateTo).setHours(23, 59, 59, 999);
        rows = rows.filter((l) => new Date(l.createdAt).getTime() <= t);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.fullName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [leads, me, search, statusFilter, sourceFilter, serviceFilter, month, dateFrom, dateTo, classifyLead]);

  // ── Summary over filtered leads ───────────────────────
  const summary = useMemo(() => {
    if (!me) {
      return { created: 0, assigned: 0, both: 0, total: 0, conversionRate: 0 };
    }
    const created = filteredLeads.filter(
      (l) =>
        (l.createdById && l.createdById === me._id) ||
        (l.createdBy && l.createdBy === me.name)
    ).length;
    const assigned = filteredLeads.filter(
      (l) => l.assignedTo && l.assignedTo === me.name
    ).length;
    const both = filteredLeads.filter((l) => {
      const byMe =
        (l.createdById && l.createdById === me._id) ||
        (l.createdBy && l.createdBy === me.name);
      const toMe = l.assignedTo && l.assignedTo === me.name;
      return byMe && toMe;
    }).length;
    const approved = filteredLeads.filter((l) => l.status === "Approved").length;
    const total = filteredLeads.length;
    const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { created, assigned, both, total, conversionRate };
  }, [filteredLeads, me]);

  // ── Charts ────────────────────────────────────────────
  const chart = useMemo(() => {
    if (!filteredLeads.length) return { timeline: [], status: [], services: [] };
    const rows = filteredLeads;

    const dayMap: Record<string, number> = {};
    rows.forEach((l) => {
      const k = new Date(l.createdAt).toISOString().slice(0, 10);
      dayMap[k] = (dayMap[k] || 0) + 1;
    });
    const timeline = Object.keys(dayMap).sort().map((d) => ({
      date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      leads: dayMap[d],
    }));

    const statusMap: Record<string, number> = {};
    rows.forEach((l) => (statusMap[l.status] = (statusMap[l.status] || 0) + 1));
    const status = Object.keys(statusMap).map((name) => ({
      name,
      value: statusMap[name],
      fill: STATUS_COLORS[name] || "#78716c",
    }));

    const svcMap: Record<string, number> = {};
    rows.forEach((l) => {
      const k = l.serviceCategory || "Unknown";
      svcMap[k] = (svcMap[k] || 0) + 1;
    });
    const services = Object.keys(svcMap).map((name) => ({ name, value: svcMap[name] }));

    return { timeline, status, services };
  }, [filteredLeads]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setServiceFilter("All");
    setPreset("all");
    setDateFrom("");
    setDateTo("");
    setMonth("");
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    (statusFilter !== "All" ? 1 : 0) +
    (sourceFilter !== "All" ? 1 : 0) +
    (serviceFilter !== "All" ? 1 : 0) +
    (preset !== "all" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (month ? 1 : 0);

  // ── Loading / Error states ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-black">Loading your analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf9] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            onClick={load}
            className="mt-4 px-3 py-1.5 bg-stone-100 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-stone-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!me) return null;

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafaf9] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/sol-ad-dash")}
              className="text-stone-400 hover:text-stone-700 transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-sm sm:text-base font-bold text-black uppercase tracking-wider">
              My Analytics
            </h2>
            <span className="px-2.5 py-1.5 border border-stone-200 bg-white text-xs font-semibold text-black shadow-sm">
              {me.name}
              <span className="text-black/40 font-normal hidden sm:inline"> · {me.role.replace("_", " ")}</span>
            </span>
          </div>
          <button
            onClick={load}
            className="self-start sm:self-auto px-3 py-1.5 bg-white border border-stone-200 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-stone-200 shadow-sm p-3 sm:p-4 mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-black/50 uppercase tracking-wider mr-1 w-full sm:w-auto mb-1 sm:mb-0">
              Range
            </span>
            {([
              ["all", "All time"],
              ["today", "Today"],
              ["week", "This week"],
              ["month", "This month"],
              ["lastMonth", "Last month"],
              ["custom", "Custom"],
            ] as [PresetKey, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setPreset(k)}
                className={`px-2 py-1 text-[10.5px] font-semibold border transition-colors ${
                  preset === k
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                }`}
              >
                {label}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-0 sm:ml-2 px-2 py-1 text-[10.5px] font-semibold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100"
              >
                Clear ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto sm:flex-1">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
              >
                <option value="All">All sources</option>
                <option value="Created">Created by me</option>
                <option value="Assigned">Assigned to me</option>
                <option value="Both">Created & assigned to me</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
              >
                <option value="All">All services</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <span className="hidden sm:block text-[10px] text-black/30 mx-1">|</span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  if (e.target.value) {
                    setDateFrom("");
                    setDateTo("");
                    setPreset("custom");
                  }
                }}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
                title="Filter by month"
              />

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setMonth("");
                  setPreset("custom");
                }}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
                title="From date"
              />
              
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setMonth("");
                  setPreset("custom");
                }}
                className="px-2 py-1.5 border border-stone-300 text-[11px] bg-white text-black outline-none focus:border-indigo-500 w-full"
                title="To date"
              />
            </div>

            <input
              className="px-2.5 py-1.5 border border-stone-300 text-[11px] text-black outline-none focus:border-indigo-500 w-full sm:w-48 sm:ml-auto"
              placeholder="Search name / email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <SplitCard label="Created by me" value={summary.created} hint="In current filter" color="text-indigo-700" />
          <SplitCard label="Assigned to me" value={summary.assigned} hint="In current filter" color="text-emerald-700" />
          <SplitCard label="Created & assigned" value={summary.both} hint="Overlap" color="text-amber-700" />
          <SplitCard label="Total shown" value={summary.total} hint="Union (deduped)" color="text-black" />
          <SplitCard label="Conversion" value={`${summary.conversionRate}%`} hint="Approved ÷ shown" color="text-black" />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-stone-200 shadow-sm p-4">
            <ChartTitle>Lead Activity</ChartTitle>
            <div className="h-48">
              {chart.timeline.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.timeline} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e7e5e4", fontSize: 11 }} />
                    <Line type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2.5, fill: "#4f46e5" }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>

          <div className="bg-white border border-stone-200 shadow-sm p-4">
            <ChartTitle>Status Breakdown</ChartTitle>
            <div className="h-48">
              {chart.status.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart.status} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e7e5e4", fontSize: 11 }} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {chart.status.map((s, i) => <Cell key={i} fill={s.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>

          <div className="bg-white border border-stone-200 shadow-sm p-4">
            <ChartTitle>Service Mix</ChartTitle>
            <div className="h-48">
              {chart.services.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chart.services} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={2} dataKey="value">
                      {chart.services.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e7e5e4", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>
        </div>

        {/* TABLE / CARDS */}
        <div className="bg-white border border-stone-200 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50">
            <h3 className="text-[11px] font-bold text-black uppercase tracking-wider">
              My Leads <span className="text-black/50 font-normal normal-case">({filteredLeads.length})</span>
            </h3>
          </div>

          {/* Mobile Card View */}
          <ul className="md:hidden divide-y divide-stone-100">
            {filteredLeads.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-black/50">
                No leads match these filters
              </li>
            ) : filteredLeads.map((l) => {
              const source = classifyLead(l);
              const sourceBadge =
                source === "Both"
                  ? { label: "Both", cls: "bg-amber-50 text-amber-700 border-amber-200" }
                  : source === "Created"
                  ? { label: "Created", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" }
                  : { label: "Assigned", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
              const assignedElsewhere = source === "Created" && l.assignedTo && l.assignedTo !== me.name;

              return (
                <li key={l._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-black text-sm truncate">{l.fullName}</p>
                      <p className="text-xs text-black/60 truncate">{l.email}</p>
                    </div>
                    <Pill status={l.status} />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border ${sourceBadge.cls}`}>
                      {sourceBadge.label}
                    </span>
                    <span className="text-black/60 truncate">{l.serviceCategory || "General"}</span>
                    <span className="text-black/40 ml-auto">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-[11px] flex items-center gap-1.5">
                    <span className="text-black/50">Assigned to:</span>
                    {l.assignedTo ? (
                      <div className="flex flex-col">
                        <span className={`font-medium ${l.assignedTo === me.name ? "text-emerald-700" : "text-black/80"}`}>
                          {l.assignedTo}
                        </span>
                        {assignedElsewhere && <span className="text-[9px] text-amber-700">(handed off)</span>}
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">Unassigned</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 z-10">
                <tr className="border-b border-stone-200 text-left">
                  <Th>Client</Th>
                  <Th>Source</Th>
                  <Th>Assigned To</Th>
                  <Th>Status</Th>
                  <Th>Service</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-black/50">
                      No leads match these filters
                    </td>
                  </tr>
                ) : filteredLeads.map((l) => {
                  const source = classifyLead(l);
                  const sourceBadge =
                    source === "Both"
                      ? { label: "Both", cls: "bg-amber-50 text-amber-700 border-amber-200" }
                      : source === "Created"
                      ? { label: "Created", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" }
                      : { label: "Assigned", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                  const assignedElsewhere = source === "Created" && l.assignedTo && l.assignedTo !== me.name;

                  return (
                    <tr key={l._id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-black text-[13px] leading-tight">{l.fullName}</div>
                        <div className="text-[10.5px] text-black/60">{l.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border ${sourceBadge.cls}`}>
                          {sourceBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.assignedTo ? (
                          <div className="flex flex-col">
                            <span className={`text-[11px] ${l.assignedTo === me.name ? "text-emerald-700 font-semibold" : "text-black/80"}`}>
                              {l.assignedTo}
                            </span>
                            {assignedElsewhere && <span className="text-[9px] text-amber-700">(handed off)</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Pill status={l.status} /></td>
                      <td className="px-4 py-3 text-[11px] text-black">{l.serviceCategory}</td>
                      <td className="px-4 py-3 text-[11px] text-black/60">
                        {new Date(l.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
function SplitCard({ label, value, hint, color }: { label: string; value: number | string; hint: string; color: string }) {
  return (
    <div className="bg-white border border-stone-200 shadow-sm p-3 sm:p-4 rounded-xl flex flex-col justify-center">
      <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider truncate">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-[9.5px] text-black/50 mt-0.5 truncate">{hint}</p>
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10.5px] font-bold text-black/70 uppercase tracking-wider mb-3">{children}</h3>;
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-[10px] font-bold text-black uppercase tracking-wider">{children}</th>;
}

function Pill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Not Interested": "bg-rose-50 text-rose-700 border-rose-200",
    Interested: "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Call Back": "bg-purple-50 text-purple-700 border-purple-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border ${map[status] || "bg-stone-100 text-black border-stone-200"}`}>
      {status}
    </span>
  );
}

function Empty() {
  return <div className="h-full flex items-center justify-center text-[11px] text-black/40">No data</div>;
}