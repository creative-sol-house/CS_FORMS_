"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Constants ───────────────────────────────────────────────
const COLORS = ["#4f46e5", "#0d9488", "#d97706", "#64748b", "#7c3aed", "#be185d"];
const STATUS_COLORS: Record<string, string> = {
  Approved: "#059669",
  Interested: "#4f46e5",
  Pending: "#d97706",
  "Call Back": "#7c3aed",
  "Not Interested": "#dc2626",
};

const STATUSES = ["Pending", "Interested", "Call Back", "Approved", "Not Interested"] as const;
const SERVICES = ["Automation Software", "Web Development", "Logo Design", "Digital Marketing"] as const;

type SourceFilter = "All" | "Created" | "Assigned" | "Both";
type PresetKey = "all" | "today" | "week" | "month" | "lastMonth" | "custom";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e7e5e4",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};
const AXIS_TICK = { fill: "#78716c", fontSize: 11 };

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

// ── Shared class strings ────────────────────────────────────
const PANEL = "bg-white border border-stone-200 rounded-xl shadow-sm";
const FIELD =
  "w-full h-9 px-3 border border-stone-300 hover:border-stone-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 rounded-lg text-[13px] bg-white text-stone-900 outline-none transition-colors";
const BTN_SECONDARY =
  "inline-flex items-center gap-2 h-9 px-3.5 bg-white border border-stone-300 hover:bg-stone-50 hover:border-stone-400 text-stone-800 text-[13px] font-medium rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/30 disabled:opacity-60 disabled:cursor-wait";

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
      return { created: 0, assigned: 0, both: 0, total: 0, approved: 0, conversionRate: 0 };
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
    return { created, assigned, both, total, approved, conversionRate };
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
  if (loading && !me) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-stone-600">
          <span className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-indigo-600 animate-spin" />
          Loading your analytics…
        </div>
      </div>
    );
  }

  if (error && !me) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-6">
        <div className={`${PANEL} p-6 max-w-sm w-full`}>
          <p className="text-sm font-semibold text-stone-900">Couldn’t load your analytics</p>
          <p className="text-[13px] text-stone-500 mt-1">{error}</p>
          <button onClick={load} className={`${BTN_SECONDARY} mt-4`}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!me) return null;

  const serviceTotal = chart.services.reduce((a, s) => a + s.value, 0);

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f7f5] p-4 sm:p-6 lg:p-8 text-stone-900">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <button
              onClick={() => router.push("/sol-ad-dash")}
              className="inline-flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-stone-900 transition-colors mb-2 focus-visible:outline-none focus-visible:underline"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">My analytics</h1>
            <p className="text-[13px] text-stone-500 mt-0.5">
              {me.name}
              <span className="text-stone-400"> · {me.role.replace("_", " ")}</span>
            </p>
          </div>

          <button onClick={load} disabled={loading} className={`${BTN_SECONDARY} self-start sm:self-auto`}>
            <svg
              className={`w-3.5 h-3.5 text-stone-500 ${loading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-stone-200 border border-stone-200 rounded-xl overflow-hidden shadow-sm mb-6">
          <Stat label="Created by me" value={summary.created} hint="Leads you added" />
          <Stat label="Assigned to me" value={summary.assigned} hint="Leads on your plate" />
          <Stat label="Created & assigned" value={summary.both} hint="Added and kept by you" />
          <Stat label="Total shown" value={summary.total} hint="Matching current filters" />
          <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5">
            <p className="text-xs text-stone-500">Conversion</p>
            <p className="text-2xl sm:text-[28px] font-semibold tracking-tight tabular-nums mt-1.5 text-indigo-700">
              {summary.conversionRate}%
            </p>
            <div className="h-1 bg-stone-100 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${summary.conversionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-2 tabular-nums">
              {summary.approved} approved of {summary.total}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className={`${PANEL} p-4 mb-6 space-y-3`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <svg className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className={`${FIELD} pl-9`}
                placeholder="Search by name, email or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search leads"
              />
            </div>

            {/* Segmented date range */}
            <div className="overflow-x-auto -mx-1 px-1 lg:mx-0 lg:px-0">
              <div className="inline-flex bg-stone-100 p-0.5 rounded-lg whitespace-nowrap" role="group" aria-label="Date range">
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
                    aria-pressed={preset === k}
                    className={`h-8 px-3 text-[13px] font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/30 ${
                      preset === k
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className={FIELD}
              aria-label="Lead source"
            >
              <option value="All">All sources</option>
              <option value="Created">Created by me</option>
              <option value="Assigned">Assigned to me</option>
              <option value="Both">Created & assigned to me</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={FIELD}
              aria-label="Status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className={FIELD}
              aria-label="Service"
            >
              <option value="All">All services</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

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
              className={FIELD}
              title="Filter by month"
              aria-label="Month"
            />

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setMonth("");
                setPreset("custom");
              }}
              className={FIELD}
              title="From date"
              aria-label="From date"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setMonth("");
                setPreset("custom");
              }}
              className={FIELD}
              title="To date"
              aria-label="To date"
            />
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-stone-500">
                {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} applied
              </p>
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className={`${PANEL} p-5`}>
            <ChartTitle title="Lead activity" sub="New leads per day" />
            <div className="h-52">
              {chart.timeline.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.timeline} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>

          <div className={`${PANEL} p-5`}>
            <ChartTitle title="Status breakdown" sub="Where your leads stand" />
            <div className="h-52">
              {chart.status.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart.status} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {chart.status.map((s, i) => <Cell key={i} fill={s.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </div>

          <div className={`${PANEL} p-5`}>
            <ChartTitle title="Service mix" sub="What clients ask for" />
            {chart.services.length ? (
              <div className="h-52 flex items-center gap-4">
                <div className="w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chart.services} cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                        {chart.services.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 min-w-0 space-y-2">
                  {chart.services.map((s, i) => (
                    <li key={s.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-stone-700 truncate flex-1">{s.name}</span>
                      <span className="text-stone-900 font-medium tabular-nums">{s.value}</span>
                      <span className="text-stone-400 tabular-nums w-9 text-right">
                        {serviceTotal ? Math.round((s.value / serviceTotal) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="h-52"><Empty /></div>
            )}
          </div>
        </div>

        {/* LEADS */}
        <div className={`${PANEL} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
            <h3 className="text-sm font-semibold">
              My leads
              <span className="ml-2 text-stone-400 font-normal tabular-nums">{filteredLeads.length}</span>
            </h3>
          </div>

          {/* Mobile list */}
          <ul className="md:hidden divide-y divide-stone-100">
            {filteredLeads.length === 0 ? (
              <li><EmptyRows onClear={activeFilterCount > 0 ? clearFilters : undefined} /></li>
            ) : filteredLeads.map((l) => {
              const source = classifyLead(l);
              const assignedElsewhere = source === "Created" && l.assignedTo && l.assignedTo !== me.name;

              return (
                <li key={l._id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{l.fullName}</p>
                      <p className="text-xs text-stone-500 truncate">{l.email}</p>
                    </div>
                    <StatusLabel status={l.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <SourceLabel source={source} />
                    <span className="truncate">{l.serviceCategory || "General"}</span>
                    <span className="ml-auto text-stone-400 tabular-nums">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-stone-500">
                    Assigned to{" "}
                    {l.assignedTo ? (
                      <span className={l.assignedTo === me.name ? "font-medium text-stone-900" : "text-stone-700"}>
                        {l.assignedTo}
                        {assignedElsewhere && <span className="ml-1 text-amber-700">(handed off)</span>}
                      </span>
                    ) : (
                      <span className="text-stone-400">nobody yet</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr className="border-b border-stone-200 text-left">
                  <Th>Client</Th>
                  <Th>Source</Th>
                  <Th>Assigned to</Th>
                  <Th>Status</Th>
                  <Th>Service</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyRows onClear={activeFilterCount > 0 ? clearFilters : undefined} />
                    </td>
                  </tr>
                ) : filteredLeads.map((l) => {
                  const source = classifyLead(l);
                  const assignedElsewhere = source === "Created" && l.assignedTo && l.assignedTo !== me.name;

                  return (
                    <tr key={l._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[13px] leading-tight">{l.fullName}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{l.email}</div>
                      </td>
                      <td className="px-5 py-3"><SourceLabel source={source} /></td>
                      <td className="px-5 py-3">
                        {l.assignedTo ? (
                          <div className="flex flex-col">
                            <span className={`text-[13px] ${l.assignedTo === me.name ? "font-medium text-stone-900" : "text-stone-700"}`}>
                              {l.assignedTo}
                            </span>
                            {assignedElsewhere && <span className="text-[11px] text-amber-700">Handed off</span>}
                          </div>
                        ) : (
                          <span className="text-[13px] text-stone-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3"><StatusLabel status={l.status} /></td>
                      <td className="px-5 py-3 text-[13px] text-stone-700">{l.serviceCategory}</td>
                      <td className="px-5 py-3 text-[13px] text-stone-500 tabular-nums whitespace-nowrap">
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
function Stat({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl sm:text-[28px] font-semibold tracking-tight tabular-nums mt-1.5 text-stone-900">{value}</p>
      <p className="text-[11px] text-stone-400 mt-2 truncate">{hint}</p>
    </div>
  );
}

function ChartTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 py-2.5 text-xs font-medium text-stone-500">{children}</th>;
}

const SOURCE_DOT = {
  Created: "bg-indigo-600",
  Assigned: "bg-teal-600",
  Both: "bg-amber-500",
} as const;

function SourceLabel({ source }: { source: "Created" | "Assigned" | "Both" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone-700 whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[source]}`} />
      {source}
    </span>
  );
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    "Not Interested": "bg-red-50 text-red-800 ring-red-600/20",
    Interested: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
    "Call Back": "bg-violet-50 text-violet-800 ring-violet-600/20",
    Pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  };
  return (
    <span
      className={`inline-flex items-center shrink-0 px-2 py-0.5 text-xs font-medium rounded-md ring-1 ring-inset whitespace-nowrap ${
        map[status] || "bg-stone-100 text-stone-700 ring-stone-500/20"
      }`}
    >
      {status}
    </span>
  );
}

function Empty() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-stone-400">
      No data for these filters
    </div>
  );
}

function EmptyRows({ onClear }: { onClear?: () => void }) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="text-sm font-medium text-stone-800">No leads match these filters</p>
      <p className="text-[13px] text-stone-500 mt-1">Try a wider date range or a different status.</p>
      {onClear && (
        <button onClick={onClear} className={`${BTN_SECONDARY} mt-4`}>
          Clear filters
        </button>
      )}
    </div>
  );
}