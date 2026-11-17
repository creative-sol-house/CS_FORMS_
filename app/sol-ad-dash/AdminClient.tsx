"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InquiryDoc, Role, UserDoc } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import UsersPanel from "@/components/UsersPanel";
import UserAnalysisPanel from "@/components/UserAnalysisPanel";
import ManageLeadModal from "@/components/ManageLeadModal";
import ChatModal from "@/components/ChatModal";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";

type ServiceFilter = "All" | "Automation Software" | "Web Development" | "Logo Design" | "Digital Marketing";

interface SessionUser {
  userId: string;
  username: string;
  email: string;
  role: Role;
  profilePicture?: string;
  passwordRequest?: boolean;
}

export default function AdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [filter, setFilter] = useState<ServiceFilter>("All");
  const [search, setSearch] = useState("");
  
  // Modals state
  const [selected, setSelected] = useState<InquiryDoc | null>(null);
  const [chatLead, setChatLead] = useState<InquiryDoc | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Forgot Password
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });

  // ── NAVIGATION & DATA LOADING ──────────────────────────────────────────────
  const setView = async (newView: string) => {
    router.push(`?tab=${newView}`);
    if (newView === "password-requests" || newView === "users") await loadUsers();
    if (newView === "user-analysis") await loadAnalysis();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
          await loadInquiries();
          if (json.user.role === "admin") {
            await loadUsers();
            await loadAnalysis();
          }
        }
      } catch {} finally { setChecking(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SSE REAL-TIME SYNC ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const es = new EventSource("/api/admin/inquiries/stream");

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "snapshot") {
          setInquiries(data.inquiries);
          return;
        }
        if (data.type === "lead:update") {
          const lead = data.lead;
          if (lead.__deleted) {
            setInquiries((prev) => prev.filter((i) => i._id !== lead._id));
            if (chatLead?._id === lead._id) setChatLead(null);
            if (selected?._id === lead._id) setSelected(null);
            return;
          }
          setInquiries((prev) => {
            const exists = prev.some((i) => i._id === lead._id);
            return exists ? prev.map((i) => (i._id === lead._id ? lead : i)) : [lead, ...prev];
          });
          setChatLead((prev) => (prev?._id === lead._id ? lead : prev));
          setSelected((prev) => (prev?._id === lead._id ? lead : prev));
        }
      } catch (err) {}
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── API CALLS ──────────────────────────────────────────────────────────────
  const login = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || "Login failed"); return; }
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meJson = await meRes.json();
      setUser(meJson.user);
      await loadInquiries();
      if (meJson.user.role === "admin") {
        await loadUsers();
        await loadAnalysis();
      }
    } catch (e: any) { setError("Network error: " + e.message); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setInquiries([]); setPassword(""); setUsername("");
  };

  const requestPassword = async () => {
    if (!user) return;
    if (!confirm("Request password reset? An admin will be notified.")) return;
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: user.email }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Request sent. Admin notified by email.");
        setUser((prev) => prev ? { ...prev, passwordRequest: true } : null);
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } catch { alert("Network error."); }
    setSettingsOpen(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true); setForgotMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const json = await res.json();
      if (json.success) {
        setForgotMessage({ type: "success", text: json.message });
        setForgotIdentifier("");
      } else {
        setForgotMessage({ type: "error", text: json.error });
      }
    } catch { setForgotMessage({ type: "error", text: "Network error" }); }
    finally { setForgotLoading(false); }
  };

  const loadInquiries = async () => {
    const res = await fetch("/api/admin/inquiries", { cache: "no-store" });
    if (res.status === 401) { setUser(null); return; }
    const json = await res.json();
    if (json.success) setInquiries(json.inquiries);
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = await res.json();
    if (json.success) setAllUsers(json.users);
  };

  const loadAnalysis = async () => {
    try {
      const res = await fetch("/api/admin/user-analysis", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setAnalysis(json.analysis);
    } catch (err) { console.error("Failed to load analysis", err); }
  };

  const updateLead = async (id: string, updates: any) => {
    const res = await fetch("/api/admin/inquiries", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    });
    const json = await res.json();
    if (!json.success) return;
    setInquiries((prev) => prev.map((i) => (i._id === id ? (json.inquiry as InquiryDoc) : i)));
    if (selected && selected._id === id) setSelected(json.inquiry as InquiryDoc);
  };

  const openChat = async (lead: InquiryDoc) => {
    setChatLead(lead);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead._id, updates: { markRead: true } }),
      });
      const json = await res.json();
      if (json.success) {
        setChatLead((prev) => (prev?._id === lead._id ? (json.inquiry as InquiryDoc) : prev));
        setInquiries((prev) => prev.map((i) => (i._id === lead._id ? (json.inquiry as InquiryDoc) : i)));
      }
    } catch {}
  };

  const sendMessage = async (text: string) => {
    if (!chatLead) return;
    const res = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: chatLead._id, updates: { newMessage: text } }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Send failed");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this inquiry permanently?")) return;
    await fetch(`/api/admin/inquiries?id=${id}`, { method: "DELETE" });
    setInquiries((prev) => prev.filter((i) => i._id !== id));
    setSelected(null);
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-black">Loading...</div>;

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9] text-black">
        <div className="w-full max-w-100">
          <div className="flex flex-col items-center mb-9">
            <h1 className="text-[24px] font-semibold text-black mt-6 tracking-tight">Sign In</h1>
            <p className="text-[13px] text-black/60 mt-1.5">Manage client inquiries</p>
          </div>

          <div className="rounded-none bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Username or Email</label>
              <input type="text" className="w-full px-3.5 py-3 text-sm text-black rounded-none border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="username or email" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Password</label>
              <input type="password" className="w-full px-3.5 py-3 text-sm text-black rounded-none border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Forgot Password?
              </button>
            </div>
            {error && <div className="text-rose-700 text-[12px] bg-rose-50 border border-rose-200 rounded-none px-3 py-2.5">{error}</div>}
            <button onClick={login} disabled={loading || !username || !password} className="w-full px-5 py-3 rounded-none font-semibold text-[13px] text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 flex justify-center items-center gap-2">
              {loading ? "Signing in…" : "Continue"}
            </button>
          </div>
        </div>

        {isForgotModalOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-none max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h2 className="text-lg font-semibold text-black">Request Password Reset</h2>
                <button onClick={() => { setIsForgotModalOpen(false); setForgotMessage({ type: "", text: "" }); }} className="text-black/50 hover:text-black text-xl font-bold">✕</button>
              </div>
              <form onSubmit={handleForgotSubmit} className="p-5 space-y-4">
                <p className="text-sm text-black/70">Enter your username or email. An admin will be notified and your new password will be sent to your email.</p>
                <input type="text" required className="w-full px-3 py-2 border border-stone-300 rounded-none" placeholder="username or email" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} />
                {forgotMessage.text && (
                  <div className={`text-xs px-3 py-2 border ${forgotMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {forgotMessage.text}
                  </div>
                )}
                <button type="submit" disabled={forgotLoading || !forgotIdentifier} className="w-full py-2 bg-indigo-600 text-white font-semibold disabled:opacity-40">
                  {forgotLoading ? "Sending..." : "Send Request"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
  const filtered = inquiries.filter((i) => {
    if (filter !== "All" && i.serviceCategory !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (i.fullName?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q) || i.phone?.toLowerCase().includes(q) || i.consultantName?.toLowerCase().includes(q));
    }
    return true;
  });

  const passwordRequests = allUsers.filter(u => u.passwordRequest === true);
  const isAdmin = user.role === "admin";
  const developers = allUsers.filter(u => u.role === "business_developer");

  return (
    <div className="flex min-h-screen bg-[#fafaf9] text-black">
      {isAdmin && (
        <Sidebar user={user} view={currentTab} setView={setView} passwordRequestCount={passwordRequests.length} logout={logout} />
      )}

      <main className={`flex-1 w-full ${isAdmin ? "lg:ml-64 ml-0" : ""} p-4 lg:p-8 overflow-x-hidden`}>
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              {isAdmin
                ? currentTab === "dashboard" ? "Dashboard Overview"
                  : currentTab === "leads" ? "Total Leads"
                  : currentTab === "users" ? "User Management"
                  : currentTab === "user-analysis" ? "User Analysis"
                  : "Password Requests"
                : "My Assigned Leads"}
            </h1>
            <p className="text-sm text-black/60 mt-1">Manage and track your client inquiries</p>
          </div>

          <div className="relative" ref={settingsRef}>
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-3 px-4 py-2 bg-white border border-stone-200 rounded-none hover:bg-stone-50 transition-colors shadow-sm">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                {/* NAVBAR PROFILE PICTURE */}
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-black leading-tight">{user.username}</p>
                <p className="text-[10px] text-black/60 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
              </div>
              <svg className={`w-4 h-4 text-black/50 transition-transform ${settingsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-none shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                  <p className="text-sm font-semibold text-black truncate">{user.username}</p>
                  <p className="text-xs text-black/60 truncate">{user.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button onClick={requestPassword} className="w-full text-left px-3 py-2 text-sm text-black hover:bg-stone-100 rounded-none flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Request Password Change
                  </button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-none flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {user.passwordRequest && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-none text-sm">
            ⏳ Your password reset request is pending admin approval. A new password will be emailed to you.
          </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {(currentTab === "dashboard" && isAdmin) && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-xl shadow-sm text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                </div>
                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-1">Total Leads</p>
                <p className="text-4xl font-extrabold">{inquiries.length}</p>
                <p className="text-[10px] text-indigo-200 mt-2 font-medium">All time inquiries</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Assigned</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter(i => i.assignedTo).length}</p>
                <div className="w-full bg-stone-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-stone-800 h-full" style={{ width: `${(inquiries.filter(i => i.assignedTo).length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter(i => i.status === "Approved").length}</p>
                <div className="w-full bg-emerald-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(inquiries.filter(i => i.status === "Approved").length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">Not Interested</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter(i => i.status === "Not Interested").length}</p>
                <div className="w-full bg-rose-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(inquiries.filter(i => i.status === "Not Interested").length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-stone-800">Lead Acquisition Trend</h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">Volume of incoming leads over time</p>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={
                      Object.entries(
                        inquiries.reduce((acc, curr) => {
                          const date = new Date(curr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          acc[date] = (acc[date] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([date, count]) => ({ date, leads: count })).reverse()
                    } margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fill: '#78716c', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fill: '#78716c', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-stone-800 mb-6">Status Breakdown</h3>
                <div className="flex-1 min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={["Pending", "Interested", "Call Back", "Approved", "Not Interested"].map(status => ({
                          name: status,
                          value: inquiries.filter(i => i.status === status).length
                        })).filter(s => s.value > 0)}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value"
                      >
                        {["Pending", "Interested", "Call Back", "Approved", "Not Interested"].map((_, index) => (
                          <Cell key={index} fill={["#f59e0b", "#4f46e5", "#8b5cf6", "#10b981", "#ef4444"][index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-stone-800">{inquiries.length}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-100">
                  {["Pending", "Interested", "Call Back", "Approved", "Not Interested"].map((status, i) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ["#f59e0b", "#4f46e5", "#8b5cf6", "#10b981", "#ef4444"][i] }}></div>
                      <span className="text-[11px] text-stone-600 font-medium">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-sm font-bold text-stone-800">Recent Leads</h3>
                <button onClick={() => setView("leads")} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">View All</button>
              </div>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-stone-200 bg-white">
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Client</th>
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Service</th>
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inquiries.slice(0, 5).map(i => (
                    <tr key={i._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-stone-800 text-[13px]">{i.fullName}</div>
                        <div className="text-[11px] text-stone-500">{i.email}</div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-stone-700">{i.serviceCategory}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          i.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          i.status === "Not Interested" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          i.status === "Interested" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-stone-100 text-stone-700 border-stone-200"
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-stone-500">{new Date(i.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TOTAL LEADS TAB --- */}
        {(currentTab === "leads" || (!isAdmin && currentTab === "dashboard")) && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <input
                className="w-full sm:w-80 px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex flex-wrap border-b border-stone-200">
                {[
                  { value: "All", label: "All Services" },
                  { value: "Automation Software", label: "Automation" },
                  { value: "Web Development", label: "Web Dev" },
                  { value: "Logo Design", label: "Logo" },
                  { value: "Digital Marketing", label: "Marketing" }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value as ServiceFilter)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      filter === tab.value
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-black/60 hover:text-black hover:border-stone-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-175">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Assigned To</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Service</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-black/50">No leads found for this filter.</td></tr>
                    ) : filtered.map((i) => {
                      const lastMessage = i.messages && i.messages.length > 0 ? i.messages[i.messages.length - 1] : null;
                      const hasUnread = lastMessage && lastMessage.sender !== user.username && !lastMessage.readBy?.includes(user.username);

                      return (
                        <tr key={i._id} className="hover:bg-stone-50/50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-black">{i.fullName}</div>
                            <div className="text-xs text-black/60">{i.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded-none text-xs font-medium border ${
                              i.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              i.status === "Not Interested" ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-stone-100 text-black border-stone-200"
                            }`}>{i.status}</span>
                          </td>
                          <td className="px-5 py-3 text-xs">
                            {i.assignedTo ? (
                              <span className="font-semibold text-indigo-700">{i.assignedTo}</span>
                            ) : <span className="text-black/40">Unassigned</span>}
                          </td>
                          <td className="px-5 py-3 text-xs text-black">{i.serviceCategory}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openChat(i)}
                                className="relative p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors"
                                title="Open Chat"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {hasUnread && (
                                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                                )}
                              </button>
                              <button
                                onClick={() => setSelected(i)}
                                className="text-indigo-600 font-medium hover:underline text-xs"
                              >
                                Manage
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {(currentTab === "users" && isAdmin) && (
          <UsersPanel currentUserId={user.userId} users={allUsers} reload={loadUsers} />
        )}

        {/* --- USER ANALYSIS TAB --- */}
        {(currentTab === "user-analysis" && isAdmin) && (
          <UserAnalysisPanel 
            analysis={analysis} 
            reload={loadAnalysis} 
            onSelectLead={(lead) => setSelected(lead)} 
          />
        )}

        {/* --- PASSWORD REQUESTS TAB --- */}
        {(currentTab === "password-requests" && isAdmin) && (
          <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-black">Password Reset Requests</h2>
              <button onClick={loadUsers} className="px-3 py-1.5 bg-stone-100 text-black border border-stone-200 rounded-none text-xs font-medium hover:bg-stone-200 transition-colors">
                Refresh List
              </button>
            </div>

            {passwordRequests.length === 0 ? (
              <p className="text-sm text-black/60">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {passwordRequests.map(u => (
                  <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-none gap-4">
                    <div>
                      <p className="font-medium text-black">{u.username}</p>
                      <p className="text-xs text-black/60">{u.email} • Requested a password change</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input type="text" placeholder="New Password" className="px-2 py-1.5 border border-stone-300 rounded-none text-sm text-black w-full sm:w-32 focus:ring-1 focus:ring-indigo-500 outline-none" id={`pass-${u._id}`} />
                      <button onClick={() => {
                        const val = (document.getElementById(`pass-${u._id}`) as HTMLInputElement).value;
                        if (val.length < 6) return alert("Min 6 chars");
                        fetch("/api/admin/users", {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u._id, newPassword: val, clearRequest: true })
                        }).then(() => { alert("Password updated. User has been emailed."); loadUsers(); });
                      }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-none text-sm font-medium hover:bg-indigo-700 flex-1 sm:flex-none">Set & Email</button>
                      <button onClick={() => {
                        fetch("/api/admin/users", {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: u._id, clearRequest: true })
                        }).then(() => loadUsers());
                      }} className="px-3 py-1.5 bg-white border border-stone-300 text-black rounded-none text-sm font-medium hover:bg-stone-50 flex-1 sm:flex-none">Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {selected && (
        <ManageLeadModal 
          lead={selected} 
          onClose={() => setSelected(null)} 
          onUpdate={(updates) => updateLead(selected._id, updates)} 
          onDelete={() => remove(selected._id)} 
          developers={developers} 
          isAdmin={isAdmin} 
          currentUser={user.username} 
        />
      )}

      {chatLead && (
        <ChatModal 
          lead={chatLead} 
          currentUser={user.username} 
          currentUserRole={user.role}
          onClose={() => setChatLead(null)} 
          onSendMessage={sendMessage} 
        />
      )}
    </div>
  );
}