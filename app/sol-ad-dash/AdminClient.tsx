"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InquiryDoc, SessionUser, UserDoc, ServiceCategory } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import UsersPanel from "@/components/UsersPanel";
import UserAnalysisPanel from "@/components/UserAnalysisPanel";
import ManageLeadModal from "@/components/ManageLeadModal";
import ChatModal from "@/components/ChatModal";
import LeadForm from "@/components/LeadForm";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import LeadAnalysisPanel from "@/components/LeadAnalysisPanel";

type ServiceFilter =
  | "All"
  | "Automation Software"
  | "Web Development"
  | "Logo Design"
  | "Digital Marketing";

const SERVICE_TABS: { value: ServiceFilter; label: string }[] = [
  { value: "All", label: "All Services" },
  { value: "Automation Software", label: "Automation" },
  { value: "Web Development", label: "Web Dev" },
  { value: "Logo Design", label: "Logo" },
  { value: "Digital Marketing", label: "Marketing" },
];

const STATUSES = [
  "Pending",
  "Interested",
  "Call Back",
  "Approved",
  "Not Interested",
] as const;

export default function AdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [editingLead, setEditingLead] = useState<InquiryDoc | null>(null);
  const [inquiries, setInquiries] = useState<InquiryDoc[]>([]);
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [filter, setFilter] = useState<ServiceFilter>("All");
  const [search, setSearch] = useState("");

  // Filters (leads tab)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creatorFilter, setCreatorFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Filters (BD dashboard)
  const [bdDateFrom, setBdDateFrom] = useState("");
  const [bdDateTo, setBdDateTo] = useState("");
  const [bdServiceFilter, setBdServiceFilter] = useState<ServiceFilter>("All");
  const [bdStatusFilter, setBdStatusFilter] = useState<string>("");
  const [bdOnlyMine, setBdOnlyMine] = useState(false);

  // Modals
  const [selected, setSelected] = useState<InquiryDoc | null>(null);
  const [chatLead, setChatLead] = useState<InquiryDoc | null>(null);

  // Add Lead modal
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadService, setAddLeadService] = useState<ServiceCategory | undefined>(undefined);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Forgot Password
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });

  // ── DERIVED VALUES (declared before any hook that uses them) ──────────────
  const isAdmin = user?.role === "admin";
  const passwordRequests = allUsers.filter((u) => u.passwordRequest === true);
  const developers = allUsers.filter((u) => u.role === "business_developer");

  // ── PERMISSIONS ───────────────────────────────────────────────────────────
  const canEditLead = (lead: InquiryDoc): boolean => {
    if (!user) return false;
    
    // 1. Admin can edit ALL leads
    if (isAdmin) return true;

    // 2. For non-admins (BDs): check ID first, then fallback to Name
    const createdById = (lead as any).createdById as string | undefined;
    const createdBy = (lead as any).createdBy as string | undefined;
    const consultantName = lead.consultantName;
    
    // If they created it (either by ID or Name match), they can edit it
    if (createdById && createdById === user.userId) return true;
    if (createdBy && createdBy === user.name) return true;
    if (consultantName && consultantName === user.name) return true;

    // 3. Form-submitted leads (no creator ID/Name at all) → NOT editable
    return false;
  };

  const canDeleteLead = (): boolean => isAdmin;

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
      } catch {
      } finally {
        setChecking(false);
      }
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
            return exists
              ? prev.map((i) => (i._id === lead._id ? lead : i))
              : [lead, ...prev];
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
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Login failed");
        return;
      }
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meJson = await meRes.json();
      setUser(meJson.user);
      await loadInquiries();
      if (meJson.user.role === "admin") {
        await loadUsers();
        await loadAnalysis();
      }
    } catch (e: any) {
      setError("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setInquiries([]);
    setPassword("");
    setEmail("");
  };

  const requestPassword = async () => {
    if (!user) return;
    if (!confirm("Request password reset? An admin will be notified.")) return;
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Request sent. Admin notified by email.");
        setUser((prev) => (prev ? { ...prev, passwordRequest: true } : null));
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } catch {
      alert("Network error.");
    }
    setSettingsOpen(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await res.json();
      if (json.success) {
        setForgotMessage({ type: "success", text: json.message });
        setForgotEmail("");
      } else {
        setForgotMessage({ type: "error", text: json.error });
      }
    } catch {
      setForgotMessage({ type: "error", text: "Network error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const loadInquiries = async () => {
    const res = await fetch("/api/admin/inquiries", { cache: "no-store" });
    if (res.status === 401) {
      setUser(null);
      return;
    }
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
    } catch (err) {
      console.error("Failed to load analysis", err);
    }
  };

  const updateLead = async (id: string, updates: any) => {
    const res = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    });
    const json = await res.json();
    if (!json.success) return;
    setInquiries((prev) =>
      prev.map((i) => (i._id === id ? (json.inquiry as InquiryDoc) : i))
    );
    if (selected && selected._id === id)
      setSelected(json.inquiry as InquiryDoc);
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
        setChatLead((prev) =>
          prev?._id === lead._id ? (json.inquiry as InquiryDoc) : prev
        );
        setInquiries((prev) =>
          prev.map((i) =>
            i._id === lead._id ? (json.inquiry as InquiryDoc) : i
          )
        );
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

  // ── ADD LEAD ──────────────────────────────────────────────────────────────
  const openAddLead = (service?: ServiceCategory) => {
    setAddLeadService(service);
    setAddLeadOpen(true);
  };

  const handleLeadCreated = (lead: InquiryDoc) => {
    setInquiries((prev) => {
      if (prev.some((i) => i._id === lead._id)) return prev;
      return [lead, ...prev];
    });
    setAddLeadOpen(false);
  };

  // ── CREATOR HELPERS ───────────────────────────────────────────────────────
  const getCreatorName = (i: InquiryDoc) => {
    const fromAudit = i.auditLogs?.find((l) => l.action === "Created")?.performedBy;
    return (
      (i as any).createdBy ||
      fromAudit ||
      i.consultantName ||
      "Unknown"
    );
  };

  const getCreatorId = (i: InquiryDoc): string | undefined =>
    (i as any).createdById as string | undefined;

  const getCreatorRole = (i: InquiryDoc): "admin" | "business_developer" | "client" => {
    const creatorId = getCreatorId(i);
    if (creatorId) {
      const match = allUsers.find((u) => u._id === creatorId);
      if (match) return match.role;
    }
    const creatorName = getCreatorName(i);
    const match = allUsers.find((u) => u.name === creatorName);
    if (match) return match.role;
    return i.consultantName ? "business_developer" : "client";
  };

  const formatCreatorBadge = (role: "admin" | "business_developer" | "client") => {
    if (role === "admin") return { label: "Admin", cls: "bg-violet-50 text-violet-700 border-violet-200" };
    if (role === "business_developer") return { label: "BD", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    return { label: "Client", cls: "bg-stone-100 text-stone-700 border-stone-200" };
  };

  // ── FILTER HELPERS ────────────────────────────────────────────────────────
  const isInDateRange = (iso: string, from: string, to: string) => {
    const t = new Date(iso).getTime();
    if (from) {
      const f = new Date(from).setHours(0, 0, 0, 0);
      if (t < f) return false;
    }
    if (to) {
      const e = new Date(to).setHours(23, 59, 59, 999);
      if (t > e) return false;
    }
    return true;
  };

  // ── LEADS TAB FILTERING ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return inquiries.filter((i) => {
      if (filter !== "All" && i.serviceCategory !== filter) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (creatorFilter && getCreatorName(i) !== creatorFilter) return false;
      if (!isInDateRange(i.createdAt, dateFrom, dateTo)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.fullName?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q) ||
          i.consultantName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiries, filter, statusFilter, creatorFilter, dateFrom, dateTo, search, allUsers]);

  const activeFiltersCount =
    (filter !== "All" ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (creatorFilter ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (search ? 1 : 0);

  const clearFilters = () => {
    setFilter("All");
    setStatusFilter("");
    setCreatorFilter("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => {
      const c = getCreatorName(i);
      if (c && c !== "Unknown") set.add(c);
    });
    return Array.from(set).sort();
  }, [inquiries]);

  // ── BD DASHBOARD FILTERING ────────────────────────────────────────────────
  const bdFiltered = useMemo(() => {
    return inquiries.filter((i) => {
      if (bdServiceFilter !== "All" && i.serviceCategory !== bdServiceFilter) return false;
      if (bdStatusFilter && i.status !== bdStatusFilter) return false;
      
      // FIXED: Check Name fallback here too
      if (bdOnlyMine) {
        const createdById = (i as any).createdById;
        const createdBy = (i as any).createdBy;
        const consultantName = i.consultantName;
        const isMine = 
          (createdById && createdById === user?.userId) ||
          (createdBy && createdBy === user?.name) ||
          (consultantName && consultantName === user?.name);
          
        if (!isMine) return false;
      }

      if (!isInDateRange(i.createdAt, bdDateFrom, bdDateTo)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiries, bdServiceFilter, bdStatusFilter, bdOnlyMine, bdDateFrom, bdDateTo, user]);

  // ── BD DASHBOARD SUMMARY (date-filtered) ──────────────────────────────────
  const bdSummary = useMemo(() => {
    const rangeFiltered = inquiries.filter((i) =>
      isInDateRange(i.createdAt, bdDateFrom, bdDateTo)
    );
    
    return {
      total: rangeFiltered.length,
      assigned: rangeFiltered.filter((i) => i.assignedTo).length,
      approved: rangeFiltered.filter((i) => i.status === "Approved").length,
      pending: rangeFiltered.filter((i) => i.status === "Pending").length,
      notInterested: rangeFiltered.filter((i) => i.status === "Not Interested").length,
      
      // FIXED: Check both ID and Name to catch older leads
      createdByMe: rangeFiltered.filter((i) => {
        const createdById = (i as any).createdById;
        const createdBy = (i as any).createdBy;
        const consultantName = i.consultantName;
        return (
          (createdById && createdById === user?.userId) ||
          (createdBy && createdBy === user?.name) ||
          (consultantName && consultantName === user?.name)
        );
      }).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiries, bdDateFrom, bdDateTo, user]);

  const bdActiveFilters =
    (bdServiceFilter !== "All" ? 1 : 0) +
    (bdStatusFilter ? 1 : 0) +
    (bdOnlyMine ? 1 : 0) +
    (bdDateFrom ? 1 : 0) +
    (bdDateTo ? 1 : 0);

  const clearBdFilters = () => {
    setBdServiceFilter("All");
    setBdStatusFilter("");
    setBdOnlyMine(false);
    setBdDateFrom("");
    setBdDateTo("");
  };

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-black">
        Loading...
      </div>
    );

  // ── LOGIN SCREEN ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9] text-black">
        <div className="w-full max-w-100">
          <div className="flex flex-col items-center mb-9">
            <h1 className="text-[24px] font-semibold text-black mt-6 tracking-tight">Sign In</h1>
            <p className="text-[13px] text-black/60 mt-1.5">Manage client inquiries</p>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-4 shadow-lg shadow-stone-900/5">
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Email Address</label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-3.5 py-3 text-sm text-black rounded-xl border border-stone-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-3 pr-10 text-sm text-black rounded-xl border border-stone-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && login()}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-stone-400 hover:text-stone-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showLoginPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                Forgot Password?
              </button>
            </div>
            {error && (
              <div className="text-rose-700 text-[12px] bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{error}</div>
            )}
            <button
              onClick={login}
              disabled={loading || !email || !password}
              className="w-full px-5 py-3 rounded-xl font-semibold text-[13px] text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 flex justify-center items-center gap-2 transition-colors"
            >
              {loading ? "Signing in…" : "Continue"}
            </button>
          </div>
        </div>

        {isForgotModalOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h2 className="text-lg font-semibold text-black">Request Password Reset</h2>
                <button
                  onClick={() => { setIsForgotModalOpen(false); setForgotMessage({ type: "", text: "" }); }}
                  className="text-black/50 hover:text-black text-xl font-bold"
                >✕</button>
              </div>
              <form onSubmit={handleForgotSubmit} className="p-5 space-y-4">
                <p className="text-sm text-black/70">Enter your email address. An admin will be notified and your new password will be sent to your email.</p>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {forgotMessage.text && (
                  <div className={`text-xs px-3 py-2 rounded-xl border ${forgotMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {forgotMessage.text}
                  </div>
                )}
                <button type="submit" disabled={forgotLoading || !forgotEmail} className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40">
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
  return (
    <div className="flex min-h-screen bg-[#fafaf9] text-black">
      {isAdmin && (
        <Sidebar
          user={user}
          view={currentTab}
          setView={setView}
          passwordRequestCount={passwordRequests.length}
          logout={logout}
        />
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
                  : currentTab === "lead-analysis" ? "Lead Analysis"

                  : "Password Requests"
                : "My Dashboard"}
            </h1>
            <p className="text-sm text-black/60 mt-1">Manage and track your client inquiries</p>
          </div>

          <div className="flex items-center gap-2">
            {["dashboard", "leads"].includes(currentTab) && (
              <button
                onClick={() => openAddLead(undefined)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Lead
              </button>
            )}

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-black leading-tight">{user.name}</p>
                  <p className="text-[10px] text-black/60 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
                </div>
                <svg className={`w-4 h-4 text-black/50 transition-transform ${settingsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-stone-100 bg-stone-50">
                    <p className="text-sm font-semibold text-black truncate">{user.name}</p>
                    <p className="text-xs text-black/60 truncate">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button onClick={requestPassword} className="w-full text-left px-3 py-2 text-sm text-black hover:bg-stone-100 rounded-lg flex items-center gap-2 transition-colors">
                      <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Request Password Change
                    </button>
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors">
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {user.passwordRequest && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
            ⏳ Your password reset request is pending admin approval. A new password will be emailed to you.
          </div>
        )}

        {/* --- ADMIN DASHBOARD --- */}
        {currentTab === "dashboard" && isAdmin && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-indigo-500 to-indigo-700 p-5 rounded-xl shadow-sm text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-1">Total Leads</p>
                <p className="text-4xl font-extrabold">{inquiries.length}</p>
                <p className="text-[10px] text-indigo-200 mt-2 font-medium">All time inquiries</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Assigned</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter((i) => i.assignedTo).length}</p>
                <div className="w-full bg-stone-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-stone-800 h-full" style={{ width: `${(inquiries.filter((i) => i.assignedTo).length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter((i) => i.status === "Approved").length}</p>
                <div className="w-full bg-emerald-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(inquiries.filter((i) => i.status === "Approved").length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">Not Interested</p>
                <p className="text-4xl font-extrabold text-stone-800">{inquiries.filter((i) => i.status === "Not Interested").length}</p>
                <div className="w-full bg-rose-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(inquiries.filter((i) => i.status === "Not Interested").length / (inquiries.length || 1)) * 100}%` }}></div>
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
                    <AreaChart
                      data={Object.entries(
                        inquiries.reduce((acc, curr) => {
                          const date = new Date(curr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          acc[date] = (acc[date] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([date, count]) => ({ date, leads: count })).reverse()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fill: "#78716c", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Area type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-stone-800 mb-6">Status Breakdown</h3>
                <div className="flex-1 min-h-62.5 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUSES.map((status) => ({
                          name: status,
                          value: inquiries.filter((i) => i.status === status).length,
                        })).filter((s) => s.value > 0)}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value"
                      >
                        {STATUSES.map((_, index) => (
                          <Cell key={index} fill={["#f59e0b", "#4f46e5", "#8b5cf6", "#10b981", "#ef4444"][index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-stone-800">{inquiries.length}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-100">
                  {STATUSES.map((status, i) => (
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
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Created By</th>
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 font-semibold text-stone-500 text-[10px] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inquiries.slice(0, 5).map((i) => {
                    const creator = getCreatorName(i);
                    const role = getCreatorRole(i);
                    const badge = formatCreatorBadge(role);
                    return (
                      <tr key={i._id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-stone-800 text-[13px]">{i.fullName}</div>
                          <div className="text-[11px] text-stone-500">{i.email}</div>
                        </td>
                        <td className="px-5 py-3 text-[12px] text-stone-700">{i.serviceCategory}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-stone-700 truncate max-w-30">{creator}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.cls}`}>{badge.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            i.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            i.status === "Not Interested" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            i.status === "Interested" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-stone-100 text-stone-700 border-stone-200"
                          }`}>{i.status}</span>
                        </td>
                        <td className="px-5 py-3 text-[11px] text-stone-500">{new Date(i.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- BUSINESS DEVELOPER DASHBOARD --- */}
        {!isAdmin && currentTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-800">Filters</h3>
                {bdActiveFilters > 0 && (
                  <button onClick={clearBdFilters} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Clear ({bdActiveFilters})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">From</label>
                  <input type="date" value={bdDateFrom} onChange={(e) => setBdDateFrom(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">To</label>
                  <input type="date" value={bdDateTo} onChange={(e) => setBdDateTo(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Service</label>
                  <select value={bdServiceFilter} onChange={(e) => setBdServiceFilter(e.target.value as ServiceFilter)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
                    {SERVICE_TABS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Status</label>
                  <select value={bdStatusFilter} onChange={(e) => setBdStatusFilter(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
                    <option value="">Any status</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-stone-700 mt-1 cursor-pointer">
                <input type="checkbox" checked={bdOnlyMine} onChange={(e) => setBdOnlyMine(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                Show only leads I created
              </label>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-indigo-500 to-indigo-700 p-5 rounded-xl shadow-sm text-white">
                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-1">Total</p>
                <p className="text-4xl font-extrabold">{bdSummary.total}</p>
                <p className="text-[10px] text-indigo-200 mt-2 font-medium">Leads in range</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Created by me</p>
                <p className="text-4xl font-extrabold text-stone-800">{bdSummary.createdByMe}</p>
                <p className="text-[10px] text-stone-500 mt-2">Leads I added</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-4xl font-extrabold text-stone-800">{bdSummary.approved}</p>
                <p className="text-[10px] text-stone-500 mt-2">Closed won</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</p>
                <p className="text-4xl font-extrabold text-stone-800">{bdSummary.pending}</p>
                <p className="text-[10px] text-stone-500 mt-2">Awaiting action</p>
              </div>
            </div>

            {/* Leads table */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-175">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Created By</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Service</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bdFiltered.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-black/50">No leads match these filters.</td></tr>
                    ) : bdFiltered.map((i) => {
                      const creator = getCreatorName(i);
                      const role = getCreatorRole(i);
                      const badge = formatCreatorBadge(role);
                      const editable = canEditLead(i);
                      const lastMessage = i.messages && i.messages.length > 0 ? i.messages[i.messages.length - 1] : null;
const hasUnread = !!(lastMessage && lastMessage.senderRole !== "admin" && !lastMessage.readBy?.includes(user.userId));
                      return (
                        <tr key={i._id} className="hover:bg-stone-50/50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-black">{i.fullName}</div>
                            <div className="text-xs text-black/50">{i.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-stone-700 truncate max-w-30">{creator}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.cls}`}>{badge.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <select
                              value={i.status}
                              onChange={(e) => updateLead(i._id, { status: e.target.value })}
                              className="text-xs border border-stone-200 rounded-lg p-1 bg-white"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3 text-xs text-black/70">{i.serviceCategory || "General"}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <IconButton label="Chat" onClick={() => openChat(i)} badge={hasUnread}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </IconButton>
                              <IconButton label="View" onClick={() => setSelected(i)}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </IconButton>
                              {editable && (
                                <IconButton label="Edit" onClick={() => setSelected(i)}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </IconButton>
                              )}
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

        {/* --- TOTAL LEADS TAB --- */}
        {currentTab === "leads" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="flex-1 min-w-[220px] px-3 py-2 border border-stone-300 rounded-xl text-sm text-black focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-xl hover:bg-stone-50">
                    Clear filters ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white border border-stone-200 rounded-xl p-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">From date</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">To date</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Created by</label>
                  <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
                    <option value="">Anyone</option>
                    {creatorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1 uppercase tracking-wider">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
                    <option value="">Any status</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center border-b border-stone-200">
                {SERVICE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      filter === tab.value ? "border-indigo-600 text-indigo-700" : "border-transparent text-black/60 hover:text-black hover:border-stone-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => openAddLead(filter === "All" ? undefined : (filter as ServiceCategory))}
                  className="ml-auto mb-1 flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add {filter === "All" ? "Lead" : filter.split(" ")[0]}
                </button>
              </div>
            </div>

            <div className="text-xs text-stone-500">
              Showing {filtered.length} of {inquiries.length} lead{inquiries.length !== 1 ? "s" : ""}
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-200">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Created By</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Assigned To</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Service</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-black/50">No leads match these filters.</td></tr>
                    ) : filtered.map((i) => {
                      const creator = getCreatorName(i);
                      const role = getCreatorRole(i);
                      const badge = formatCreatorBadge(role);
                      const editable = canEditLead(i);
                      const lastMessage = i.messages && i.messages.length > 0 ? i.messages[i.messages.length - 1] : null;
                      const hasUnread = !!(lastMessage && lastMessage.senderRole !== "admin" && !lastMessage.readBy?.includes(user.userId));
                      return (
                        <tr key={i._id} className="hover:bg-stone-50/50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-black">{i.fullName}</div>
                            <div className="text-xs text-black/50">{i.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-stone-700 truncate max-w-30">{creator}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.cls}`}>{badge.label}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <select
                              value={i.status}
                              onChange={(e) => updateLead(i._id, { status: e.target.value })}
                              className="text-xs border border-stone-200 rounded-lg p-1 bg-white"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            {isAdmin ? (
                              <select
                                value={i.assignedTo || ""}
                                onChange={(e) => updateLead(i._id, { assignedTo: e.target.value })}
                                className="text-xs border border-stone-200 rounded-lg p-1 bg-white"
                              >
                                <option value="">Unassigned</option>
                                {developers.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs text-black/70">{i.assignedTo || "Unassigned"}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-black/70">{i.serviceCategory || "General"}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <IconButton label="Chat" onClick={() => openChat(i)} badge={hasUnread}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </IconButton>
                              <IconButton label="View" onClick={() => setSelected(i)}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </IconButton>
                              {editable && (
                                <IconButton label="Edit" onClick={() => setSelected(i)}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </IconButton>
                              )}
                              {canDeleteLead() && (
                                <IconButton label="Delete" variant="danger" onClick={() => remove(i._id)}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </IconButton>
                              )}
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
        {currentTab === "users" && isAdmin && (
          <UsersPanel currentUserId={user.userId} users={allUsers} reload={loadUsers} />
        )}

        {/* --- USER ANALYSIS TAB --- */}
        {currentTab === "user-analysis" && isAdmin && (
          <UserAnalysisPanel analysis={analysis} reload={loadAnalysis} onSelectLead={(lead) => setSelected(lead)} />
        )}

{/* --- LEAD ANALYSIS TAB --- */}
{currentTab === "lead-analysis" && isAdmin && (
  <LeadAnalysisPanel />
)}
        {/* --- PASSWORD REQUESTS TAB --- */}
        {currentTab === "password-requests" && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black">Password Reset Requests</h2>
            {passwordRequests.length === 0 ? (
              <p className="text-sm text-black/50">No pending password reset requests.</p>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 font-semibold text-black text-[11px] uppercase tracking-wider">Requested At</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {passwordRequests.map((u) => (
                      <tr key={u._id} className="hover:bg-stone-50/50">
                        <td className="px-5 py-3 font-medium text-black">{u.name}</td>
                        <td className="px-5 py-3 text-black/70">{u.email}</td>
                        <td className="px-5 py-3 text-black/50 text-xs">{u.requestDate ? new Date(u.requestDate).toLocaleString() : "N/A"}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={async () => {
                              const newPass = prompt(`Enter new temporary password for ${u.name}:`);
                              if (!newPass) return;
                              const res = await fetch(`/api/admin/users/${u._id}/reset-password`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ password: newPass }),
                              });
                              const json = await res.json();
                              if (json.success) {
                                alert("Password reset successfully and emailed to user.");
                                await loadUsers();
                              } else {
                                alert("Failed: " + json.error);
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {selected && (
  <ManageLeadModal
    lead={selected}
    onClose={() => setSelected(null)}
    onUpdate={(updates) => updateLead(selected._id, updates)}
    onDelete={() => remove(selected._id)}
    developers={developers}
    isAdmin={isAdmin}
    currentUser={user.name}
    canEdit={canEditLead(selected)}
    canDelete={canDeleteLead()}
    onEdit={() => {
      setEditingLead(selected);
      setSelected(null);
    }}
  />
)}

{/* NEW: full-field edit form */}
{editingLead && (
  <LeadForm
    consultantName={user.name}
    consultantId={user.userId}
    leadId={editingLead._id}
    lockedService={editingLead.serviceCategory}
    initialData={editingLead}
    onClose={() => setEditingLead(null)}
    onSaved={(updated) => {
      setInquiries((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      );
      setEditingLead(null);
    }}
  />
)}

      {chatLead && (
        <ChatModal
          lead={chatLead}
          currentUser={user.name}
          currentUserRole={user.role}
          onClose={() => setChatLead(null)}
          onSendMessage={sendMessage}
        />
      )}

      {addLeadOpen && user && (
        <LeadForm
          consultantName={user.name}
          consultantId={user.userId}
          lockedService={addLeadService}
          onClose={() => setAddLeadOpen(false)}
          onSaved={handleLeadCreated}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   IconButton — small, cute, tooltip on hover
   ──────────────────────────────────────────────────────────────────────────── */
function IconButton({
  children,
  label,
  onClick,
  badge,
  variant,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: boolean;
  variant?: "default" | "danger";
}) {
  const base =
    "relative inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150 active:scale-95";
  const colors =
    variant === "danger"
      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700";
  return (
    <button onClick={onClick} title={label} aria-label={label} className={`${base} ${colors}`}>
      {children}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
      )}
    </button>
  );
}