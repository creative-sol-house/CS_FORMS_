"use client";
import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";

export default function LeadAnalysisPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/lead-analysis")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center text-stone-500">Loading report...</div>;
  if (!data) return <div className="p-10 text-center text-rose-500">Failed to load report.</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">Total Leads</p>
          <p className="text-3xl font-extrabold text-stone-800">{data.totalLeads}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Conversion Rate</p>
          <p className="text-3xl font-extrabold text-stone-800">{data.conversionRate}%</p>
          <p className="text-[11px] text-stone-500 mt-1">{data.approved} won / {data.totalLeads} total</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Calls Logged</p>
          <p className="text-3xl font-extrabold text-stone-800">{data.calls}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-1">Meetings</p>
          <p className="text-3xl font-extrabold text-stone-800">{data.meetings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Services */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Leads by Service</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadsByService}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Recent Calls & Meetings</h3>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-stone-500">No follow-ups logged yet.</p>
            ) : (
              data.recentActivity.map((act: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    act.type === 'Call' ? 'bg-blue-100 text-blue-600' : 
                    act.type === 'Meeting' ? 'bg-purple-100 text-purple-600' : 
                    'bg-stone-200 text-stone-600'
                  }`}>
                    {act.type === 'Call' ? '📞' : act.type === 'Meeting' ? '🤝' : '📝'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{act.note || `${act.type} logged`}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {new Date(act.date).toLocaleDateString()} · by {act.loggedBy}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}