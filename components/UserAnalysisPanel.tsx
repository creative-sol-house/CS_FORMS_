"use client";
import { useState, useMemo, useEffect } from "react";
import { InquiryDoc } from "@/lib/types";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981", Interested: "#4f46e5", Pending: "#f59e0b",
  "Call Back": "#8b5cf6", "Not Interested": "#ef4444",
};

export default function UserAnalysisPanel({
  analysis, reload, onSelectLead,
}: {
  analysis: any[];
  reload: () => void;
  onSelectLead: (lead: InquiryDoc) => void;
}) {
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const selected = useMemo(
    () => analysis.find((u) => u._id === userId) || null,
    [analysis, userId]
  );

  useEffect(() => {
    if (!userId && analysis.length) setUserId(analysis[0]._id);
  }, [analysis, userId]);

  const chart = useMemo(() => {
    if (!selected?.leads?.length) return { timeline: [], status: [], services: [] };
    const leads = selected.leads as any[];

    const dayMap: Record<string, number> = {};
    leads.forEach((l) => {
      const k = new Date(l.createdAt).toISOString().slice(0, 10);
      dayMap[k] = (dayMap[k] || 0) + 1;
    });
    const timeline = Object.keys(dayMap).sort().map((d) => ({
      date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      leads: dayMap[d],
    }));

    const statusMap: Record<string, number> = {};
    leads.forEach((l) => (statusMap[l.status] = (statusMap[l.status] || 0) + 1));
    const status = Object.keys(statusMap).map((name) => ({
      name, value: statusMap[name], fill: STATUS_COLORS[name] || "#78716c",
    }));

    const svcMap: Record<string, number> = {};
    leads.forEach((l) => {
      const k = l.serviceCategory || "Unknown";
      svcMap[k] = (svcMap[k] || 0) + 1;
    });
    const services = Object.keys(svcMap).map((name) => ({ name, value: svcMap[name] }));

    return { timeline, status, services };
  }, [selected]);

  const visibleLeads = useMemo(() => {
    if (!selected?.leads) return [];
    let rows = [...selected.leads];
    if (statusFilter !== "All") rows = rows.filter((l: any) => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l: any) =>
          l.fullName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [selected, search, statusFilter]);

  return (
    <div className="bg-white border border-stone-200 shadow-sm">

      {/* ── TOP TOOLBAR ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-black uppercase tracking-wider">User Analytics</h2>
          <select
            className="px-2.5 py-1.5 border border-stone-300 text-xs font-medium outline-none focus:border-indigo-500 bg-white min-w-48"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="" disabled>Select team member…</option>
            {analysis.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username} ({u.leads.length} leads)
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={reload}
          className="px-3 py-1.5 bg-stone-100 text-black text-[11px] font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {!selected ? (
        <div className="h-56 flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-medium text-black">Select a user to view analytics</p>
          <p className="text-xs text-black/50 mt-1">Choose from the dropdown above</p>
        </div>
      ) : (
        <>
          {/* ── KPI STRIP ──────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-200 divide-x divide-stone-200">
            <KPI label="Total Leads" value={selected.leads.length} color="text-black" />
            <KPI label="Approved" value={selected.statusCounts.Approved} color="text-emerald-600" />
            <KPI label="Interested" value={selected.statusCounts.Interested} color="text-indigo-600" />
            <KPI label="Conversion" value={`${selected.conversionRate}%`} color="text-black" />
          </div>

          {/* ── CHARTS ROW (3 panels in one frame) ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-stone-200 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
            <div className="lg:col-span-1 p-4">
              <ChartTitle>Lead Activity</ChartTitle>
              <div className="h-48">
                {chart.timeline.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart.timeline} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e7e5e4", fontSize: 11 }} />
                      <Line type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={2}
                        dot={{ r: 2.5, fill: "#4f46e5" }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </div>

            <div className="p-4">
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

            <div className="p-4">
              <ChartTitle>Service Mix</ChartTitle>
              <div className="h-48">
                {chart.services.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chart.services} cx="50%" cy="50%" innerRadius={38} outerRadius={65}
                        paddingAngle={2} dataKey="value">
                        {chart.services.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e7e5e4", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </div>
            </div>
          </div>

          {/* ── TABLE TOOLBAR ──────────────────────────────── */}
          <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-2.5 border-b border-stone-200 bg-stone-50">
            <h3 className="text-[11px] font-bold text-black uppercase tracking-wider">
              Leads <span className="text-black/50 font-normal normal-case">({visibleLeads.length})</span>
            </h3>
            <div className="flex gap-2">
              <input
                className="px-2.5 py-1 border border-stone-300 text-xs text-black outline-none focus:border-indigo-500 w-44"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="px-2.5 py-1 border border-stone-300 text-xs text-black outline-none focus:border-indigo-500 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option>Pending</option>
                <option>Interested</option>
                <option>Call Back</option>
                <option>Approved</option>
                <option>Not Interested</option>
              </select>
            </div>
          </div>

          {/* ── TABLE ──────────────────────────────────────── */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 z-10">
                <tr className="border-b border-stone-200 text-left">
                  <Th>Client</Th>
                  <Th>Status</Th>
                  <Th>Service</Th>
                  <Th>Date</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleLeads.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-black/50">No leads found</td></tr>
                ) : visibleLeads.map((l: any) => (
                  <tr key={l._id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-black text-[13px] leading-tight">{l.fullName}</div>
                      <div className="text-[10.5px] text-black/60">{l.email}</div>
                    </td>
                    <td className="px-4 py-2.5"><Pill status={l.status} /></td>
                    <td className="px-4 py-2.5 text-[11px] text-black">{l.serviceCategory}</td>
                    <td className="px-4 py-2.5 text-[11px] text-black/60">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onSelectLead(l)}
                        className="text-indigo-600 font-semibold hover:underline text-[11px]">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────

function KPI({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10.5px] font-bold text-black/70 uppercase tracking-wider mb-2">{children}</h3>;
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-[10px] font-bold text-black uppercase tracking-wider">
      {children}
    </th>
  );
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