"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { InquiryDoc, SessionUser, UserDoc, ServiceCategory } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import UsersPanel from "@/components/UsersPanel";
import UserAnalysisPanel from "@/components/UserAnalysisPanel";
import ManageLeadModal from "@/components/ManageLeadModal";
import ChatModal from "@/components/ChatModal";
import LeadForm from "@/components/LeadForm";
import InstallButton from "@/components/install-button";

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

const SERVICE_TABS: { value: ServiceFilter; label: string; short: string }[] = [
  { value: "All", label: "All Services", short: "All" },
  { value: "Automation Software", label: "Automation", short: "Auto" },
  { value: "Web Development", label: "Web Dev", short: "Web" },
  { value: "Logo Design", label: "Logo", short: "Logo" },
  { value: "Digital Marketing", label: "Marketing", short: "Mktg" },
];

const STATUSES = [
  "Pending",
  "Interested",
  "Call Back",
  "Approved",
  "Not Interested",
] as const;

function unreadCountFor(lead: InquiryDoc, userName: string): number {
  const messages = lead.messages || [];
  return messages.reduce((acc, m) => {
    if (m.sender === userName) return acc;
    if (Array.isArray(m.readBy) && m.readBy.includes(userName)) return acc;
    return acc + 1;
  }, 0);
}

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

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creatorFilter, setCreatorFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  
  const [regionFilter, setRegionFilter] = useState<"All" | "Local" | "International">("All");
  const [bdRegionFilter, setBdRegionFilter] = useState<"All" | "Local" | "International">("All");
  const [bdSearch, setBdSearch] = useState("");
  const [bdDateFrom, setBdDateFrom] = useState("");
  const [bdDateTo, setBdDateTo] = useState("");
  const [bdServiceFilter, setBdServiceFilter] = useState<ServiceFilter>("All");
  const [bdStatusFilter, setBdStatusFilter] = useState<string>("");
  const [bdOnlyMine, setBdOnlyMine] = useState(false);
  const [bdOnlyUnread, setBdOnlyUnread] = useState(false);

  const [selected, setSelected] = useState<InquiryDoc | null>(null);
  const [chatLead, setChatLead] = useState<InquiryDoc | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadService, setAddLeadService] = useState<ServiceCategory | undefined>(undefined);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });

  const isAdmin = user?.role === "admin";
  const passwordRequests = allUsers.filter((u) => u.passwordRequest === true);
  const developers = allUsers.filter((u) => u.role === "business_developer");

  const canEditLead = (lead: InquiryDoc): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    const createdById = (lead as any).createdById as string | undefined;
    const createdBy = (lead as any).createdBy as string | undefined;
    const consultantName = lead.consultantName;
    if (createdById && createdById === user.userId) return true;
    if (createdBy && createdBy === user.name) return true;
    if (consultantName && consultantName === user.name) return true;
    return false;
  };

  const canDeleteLead = (): boolean => isAdmin;

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

          if (lead.__drop) {
            setInquiries((prev) => prev.filter((i) => i._id !== lead._id));
            if (chatLead?._id === lead._id) setChatLead(null);
            if (selected?._id === lead._id) setSelected(null);
            return;
          }

          if (lead.__deleted) {
            setInquiries((prev) => prev.filter((i) => i._id !== lead._id));
            if (chatLead?._id === lead._id) setChatLead(null);
            if (selected?._id === lead._id) setSelected(null);
            return;
          }

          const mine = user.role === "admin"
            ? true
            : (lead.createdById && lead.createdById === user.userId) ||
              (lead.createdBy && lead.createdBy === user.name) ||
              (lead.assignedTo && lead.assignedTo === user.name);

          if (!mine) {
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
      } catch {}
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const getLeadTitle = (i: InquiryDoc): string => {
    const company = (i as any).companyName?.trim?.();
    if (i.clientType === "Business" && company) return company;
    return i.fullName || "Unnamed Lead";
  };

  const getLeadSubtitle = (i: InquiryDoc): string => {
    const company = (i as any).companyName?.trim?.();
    if (i.clientType === "Business" && company && i.fullName) {
      return i.fullName;
    }
    return i.email || "";
  };

  const isInternationalLead = (i: InquiryDoc): boolean => {
    const flagged = (i as any).isInternationalClient;
    if (typeof flagged === "boolean") return flagged;
    const country = (i as any).country?.trim?.();
    return !!country && country !== "Pakistan";
  };

  const getCreatorName = (i: InquiryDoc) => {
    const fromAudit = i.auditLogs?.find((l) => l.action === "Created")?.performedBy;
    return (i as any).createdBy || fromAudit || i.consultantName || "Unknown";
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

  const filtered = useMemo(() => {
    return inquiries.filter((i) => {
      if (filter !== "All" && i.serviceCategory !== filter) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (regionFilter !== "All") {
        const intl = isInternationalLead(i);
        if (regionFilter === "International" && !intl) return false;
        if (regionFilter === "Local" && intl) return false;
      }
      if (creatorFilter && getCreatorName(i) !== creatorFilter) return false;
      if (onlyUnread && user && unreadCountFor(i, user.name) === 0) return false;
      if (!isInDateRange(i.createdAt, dateFrom, dateTo)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.fullName?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q) ||
          i.consultantName?.toLowerCase().includes(q) ||
          ((i as any).companyName?.toLowerCase?.().includes(q) ?? false)
        );
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiries, filter, statusFilter, creatorFilter, dateFrom, dateTo, search, allUsers, onlyUnread, user, regionFilter]);

  const activeFiltersCount =
    (filter !== "All" ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (creatorFilter ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (search ? 1 : 0) +
    (onlyUnread ? 1 : 0) +
    (regionFilter !== "All" ? 1 : 0);

  const clearFilters = () => {
    setFilter("All");
    setStatusFilter("");
    setCreatorFilter("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setOnlyUnread(false);
    setRegionFilter("All");
  };

  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => {
      const c = getCreatorName(i);
      if (c && c !== "Unknown") set.add(c);
    });
    return Array.from(set).sort();
  }, [inquiries]);

  const bdFiltered = useMemo(() => {
    return inquiries.filter((i) => {
      if (bdServiceFilter !== "All" && i.serviceCategory !== bdServiceFilter) return false;
      if (bdStatusFilter && i.status !== bdStatusFilter) return false;
      if (bdOnlyUnread && user && unreadCountFor(i, user.name) === 0) return false;

      if (bdRegionFilter !== "All") {
        const intl = isInternationalLead(i);
        if (bdRegionFilter === "International" && !intl) return false;
        if (bdRegionFilter === "Local" && intl) return false;
      }

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

      if (bdSearch) {
        const q = bdSearch.toLowerCase();
        const matches =
          i.fullName?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q) ||
          i.consultantName?.toLowerCase().includes(q) ||
          ((i as any).companyName?.toLowerCase?.().includes(q) ?? false);
        if (!matches) return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiries, bdServiceFilter, bdStatusFilter, bdOnlyMine, bdDateFrom, bdDateTo, bdOnlyUnread, user, bdRegionFilter, bdSearch]);

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
    (bdOnlyUnread ? 1 : 0) +
    (bdDateFrom ? 1 : 0) +
    (bdDateTo ? 1 : 0) +
    (bdRegionFilter !== "All" ? 1 : 0) +
    (bdSearch ? 1 : 0);

  const clearBdFilters = () => {
    setBdServiceFilter("All");
    setBdStatusFilter("");
    setBdOnlyMine(false);
    setBdOnlyUnread(false);
    setBdDateFrom("");
    setBdDateTo("");
    setBdRegionFilter("All");
    setBdSearch("");
  };

  const totalUnreadLeads = useMemo(
    () => (user ? inquiries.filter((i) => unreadCountFor(i, user.name) > 0).length : 0),
    [inquiries, user]
  );

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-black">
        Loading...
      </div>
    );

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#fafaf9] text-black">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-semibold text-black tracking-tight">Sign In</h1>
            <p className="text-[13px] text-black/60 mt-1.5">Manage client inquiries</p>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 md:p-6 space-y-4 shadow-lg shadow-stone-900/5">
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
              <form onSubmit={handleForgotSubmit} className="p-4 sm:p-5 space-y-4">
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

  return (
<div className="flex flex-col lg:flex-row min-h-screen bg-[#fafaf9] text-black">
    {isAdmin && (
        <Sidebar
          user={user}
          view={currentTab}
          setView={setView}
          passwordRequestCount={passwordRequests.length}
          logout={logout}
        />
      )}

      <main className="flex-1 w-full min-w-0 px-3 sm:px-4 lg:px-6 py-3 lg:py-6 overflow-x-hidden pb-24 lg:pb-6">

<header className="mb-4 sm:mb-6 space-y-3">
  {/* Row 1: title + profile */}
  <div className={`flex items-center justify-between gap-3 ${isAdmin ? "pr-12 lg:pr-0" : ""}`}>
    <div className="min-w-0 flex-1">
      <h1 className="text-base sm:text-2xl font-bold text-black tracking-tight truncate">
        {isAdmin
          ? currentTab === "dashboard" ? "Dashboard Overview"
            : currentTab === "leads" ? "Total Leads"
            : currentTab === "users" ? "User Management"
            : currentTab === "user-analysis" ? "User Analysis"
            : currentTab === "lead-analysis" ? "Lead Analysis"
            : "Password Requests"
          : "My Dashboard"}
      </h1>
      <p className="hidden sm:block text-sm text-black/60 mt-0.5">
        Manage and track your client inquiries
      </p>
    </div>

    {/* Profile (same position for admin + employee, never fixed) */}
    <div ref={settingsRef} className="relative shrink-0">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="flex items-center gap-2 p-1 md:pl-1 md:pr-3 bg-white border border-stone-200 hover:border-indigo-300 rounded-full shadow-sm transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="Me" className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-black leading-tight truncate max-w-[120px]">{user.name}</p>
          <p className="text-[10px] text-black/60 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
        </div>
        <svg
          className={`hidden md:block w-3.5 h-3.5 text-black/50 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {settingsOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-stone-100 bg-stone-50">
            <p className="text-sm font-semibold text-black truncate">{user.name}</p>
            <p className="text-xs text-black/60 truncate">{user.email}</p>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={requestPassword}
              className="w-full text-left px-3 py-2 text-sm text-black hover:bg-indigo-50 hover:text-indigo-700 rounded-xl flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Request Password Change
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
            >
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

  {/* Row 2: actions */}
  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
    {["dashboard", "leads"].includes(currentTab) && (
      <button
        onClick={() => openAddLead(undefined)}
        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm active:scale-95 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add
      </button>
    )}

    <Link
      href="/sol-ad-dash/my-analytics"
      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs sm:text-sm font-semibold rounded-full shadow-sm active:scale-95 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span className="sm:hidden">Analytics</span>
      <span className="hidden sm:inline">My Analytics</span>
    </Link>

    <div className="shrink-0">
      <InstallButton />
    </div>
  </div>
</header>
        {user.passwordRequest && (
          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm">
            ⏳ Your password reset request is pending admin approval. A new password will be emailed to you.
          </div>
        )}

        {/* ─── ADMIN DASHBOARD ─── */}
        {currentTab === "dashboard" && isAdmin && (
          <div className="space-y-3 sm:space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-linear-to-br from-indigo-500 to-indigo-700 p-3 sm:p-4 rounded-xl shadow-sm text-white relative overflow-hidden">
                <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-wider mb-1">Total Leads</p>
                <p className="text-xl sm:text-3xl font-extrabold">{inquiries.length}</p>
                <p className="text-[9px] text-indigo-200 mt-1 font-medium">All time</p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Assigned</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{inquiries.filter((i) => i.assignedTo).length}</p>
                <div className="w-full bg-stone-100 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="bg-stone-800 h-full" style={{ width: `${(inquiries.filter((i) => i.assignedTo).length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{inquiries.filter((i) => i.status === "Approved").length}</p>
                <div className="w-full bg-emerald-100 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(inquiries.filter((i) => i.status === "Approved").length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Not Interested</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{inquiries.filter((i) => i.status === "Not Interested").length}</p>
                <div className="w-full bg-rose-100 h-1 mt-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(inquiries.filter((i) => i.status === "Not Interested").length / (inquiries.length || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="lg:col-span-2 bg-white border border-stone-200 p-3 sm:p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-stone-800">Lead Acquisition Trend</h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">Volume over time</p>
                  </div>
                </div>
                <div className="h-48 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={Object.entries(
                        inquiries.reduce((acc, curr) => {
                          const date = new Date(curr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          acc[date] = (acc[date] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([date, count]) => ({ date, leads: count })).reverse()}
                      margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} dy={6} />
                      <YAxis tick={{ fill: "#78716c", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="leads" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-3 sm:p-4 rounded-xl shadow-sm flex flex-col">
                <h3 className="text-xs sm:text-sm font-bold text-stone-800 mb-2">Status Breakdown</h3>
                <div className="flex-1 min-h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUSES.map((status) => ({
                          name: status,
                          value: inquiries.filter((i) => i.status === status).length,
                        })).filter((s) => s.value > 0)}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value"
                      >
                        {STATUSES.map((_, index) => (
                          <Cell key={index} fill={["#f59e0b", "#4f46e5", "#8b5cf6", "#10b981", "#ef4444"][index]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl sm:text-2xl font-extrabold text-stone-800">{inquiries.length}</span>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-stone-100">
                  {STATUSES.map((status, i) => (
                    <div key={status} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ["#f59e0b", "#4f46e5", "#8b5cf6", "#10b981", "#ef4444"][i] }}></div>
                      <span className="text-[10px] text-stone-600 font-medium truncate">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-xs sm:text-sm font-bold text-stone-800">Recent Leads</h3>
                <button onClick={() => setView("leads")} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                  View All
                </button>
              </div>

              <ul className="lg:hidden divide-y divide-stone-100">
                {inquiries.slice(0, 5).map((i) => {
                  const creator = getCreatorName(i);
                  const role = getCreatorRole(i);
                  const badge = formatCreatorBadge(role);
                  return (
                    <li key={i._id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-stone-800 truncate flex items-center gap-1">
                            <span className="truncate">{getLeadTitle(i)}</span>
                            {isInternationalLead(i) && (
                              <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                            )}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">{getLeadSubtitle(i)}</p>
                        </div>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                          i.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          i.status === "Not Interested" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          i.status === "Interested" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-stone-100 text-stone-700 border-stone-200"
                        }`}>{i.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-500 flex-wrap">
                        <span className="truncate">{i.serviceCategory}</span>
                        <span>·</span>
                        <span className="truncate">{creator}</span>
                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${badge.cls}`}>{badge.label}</span>
                        <span className="ml-auto">{new Date(i.createdAt).toLocaleDateString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[720px]">
                  <thead>
                    <tr className="border-b border-stone-200 bg-white">
                      <th className="w-[32%] px-3 py-2 font-semibold text-stone-500 text-[10px] uppercase tracking-wider text-left">Client</th>
                      <th className="w-[20%] px-3 py-2 font-semibold text-stone-500 text-[10px] uppercase tracking-wider text-left">Service</th>
                      <th className="w-[24%] px-3 py-2 font-semibold text-stone-500 text-[10px] uppercase tracking-wider text-left">Created By</th>
                      <th className="w-[16%] px-3 py-2 font-semibold text-stone-500 text-[10px] uppercase tracking-wider text-left">Status</th>
                      <th className="w-[8%] px-3 py-2 font-semibold text-stone-500 text-[10px] uppercase tracking-wider text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {inquiries.slice(0, 5).map((i) => {
                      const creator = getCreatorName(i);
                      const role = getCreatorRole(i);
                      const badge = formatCreatorBadge(role);
                      return (
                        <tr key={i._id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-stone-800 text-[12px] truncate flex items-center gap-1">
                              <span className="truncate">{getLeadTitle(i)}</span>
                              {isInternationalLead(i) && (
                                <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate">{getLeadSubtitle(i)}</div>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-stone-700 truncate">{i.serviceCategory}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[11px] text-stone-700 truncate">{creator}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${badge.cls}`}>{badge.label}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              i.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              i.status === "Not Interested" ? "bg-rose-50 text-rose-700 border-rose-200" :
                              i.status === "Interested" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              "bg-stone-100 text-stone-700 border-stone-200"
                            }`}>{i.status}</span>
                          </td>
                          <td className="px-3 py-2 text-[10px] text-stone-500 text-right">{new Date(i.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── BD DASHBOARD ─── */}
        {!isAdmin && currentTab === "dashboard" && (
          <div className="space-y-3 sm:space-y-5 animate-in fade-in duration-300">
            <div className="bg-white border border-stone-200 rounded-xl p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-stone-800">Filters</h3>
                {bdActiveFilters > 0 && (
                  <button onClick={clearBdFilters} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Clear ({bdActiveFilters})
                  </button>
                )}
              </div>
               <input
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs sm:text-sm text-black focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Search name, company, email, phone…"
                value={bdSearch}
                onChange={(e) => setBdSearch(e.target.value)}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">From</label>
                  <input type="date" value={bdDateFrom} onChange={(e) => setBdDateFrom(e.target.value)} className="w-full px-2 py-1 border border-stone-300 rounded-lg text-[11px]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">To</label>
                  <input type="date" value={bdDateTo} onChange={(e) => setBdDateTo(e.target.value)} className="w-full px-2 py-1 border border-stone-300 rounded-lg text-[11px]" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Service</label>
                  <select value={bdServiceFilter} onChange={(e) => setBdServiceFilter(e.target.value as ServiceFilter)} className="w-full px-2 py-1 border border-stone-300 rounded-lg text-[11px] bg-white">
                    {SERVICE_TABS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Status</label>
                  <select value={bdStatusFilter} onChange={(e) => setBdStatusFilter(e.target.value)} className="w-full px-2 py-1 border border-stone-300 rounded-lg text-[11px] bg-white">
                    <option value="">Any</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Region</label>
                  <select value={bdRegionFilter} onChange={(e) => setBdRegionFilter(e.target.value as any)} className="w-full px-2 py-1 border border-stone-300 rounded-lg text-[11px] bg-white">
                    <option value="All">All</option>
                    <option value="Local">Local (PK)</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-700 cursor-pointer">
                  <input type="checkbox" checked={bdOnlyMine} onChange={(e) => setBdOnlyMine(e.target.checked)} className="w-3.5 h-3.5 accent-indigo-600" />
                  Mine
                </label>
                <button
                  type="button"
                  onClick={() => setBdOnlyUnread((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    bdOnlyUnread
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <svg className={`w-3 h-3 ${bdOnlyUnread ? "text-white" : "text-rose-600"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Unread
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-linear-to-br from-indigo-500 to-indigo-700 p-3 rounded-xl shadow-sm text-white">
                <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-xl sm:text-3xl font-extrabold">{bdSummary.total}</p>
                <p className="text-[9px] text-indigo-200 mt-0.5">In range</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Mine</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{bdSummary.createdByMe}</p>
                <p className="text-[9px] text-stone-500 mt-0.5">I created</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Approved</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{bdSummary.approved}</p>
                <p className="text-[9px] text-stone-500 mt-0.5">Won</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Pending</p>
                <p className="text-xl sm:text-3xl font-extrabold text-stone-800">{bdSummary.pending}</p>
                <p className="text-[9px] text-stone-500 mt-0.5">Awaiting</p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <ul className="lg:hidden divide-y divide-stone-100">
                {bdFiltered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-black/50">No leads match these filters.</li>
                ) : bdFiltered.map((i) => {
                  const creator = getCreatorName(i);
                  const role = getCreatorRole(i);
                  const badge = formatCreatorBadge(role);
                  const unread = user ? unreadCountFor(i, user.name) : 0;
                  return (
                    <li key={i._id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-stone-800 truncate flex items-center gap-1">
                            <span className="truncate">{getLeadTitle(i)}</span>
                            {isInternationalLead(i) && (
                              <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                            )}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">{getLeadSubtitle(i)}</p>
                        </div>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold">
                            {unread}
                          </span>
                        )}
                      </div>
                      {i.assignedTo && (
                        <div className="mt-1 text-[10px] font-medium flex items-center gap-1 flex-wrap">
                          <span className="text-stone-500">Assigned to:</span>
                          <span className={i.assignedTo === user.name ? "text-indigo-700 font-semibold" : "text-stone-800"}>
                            {i.assignedTo}
                            {i.assignedTo === user.name ? " (you)" : ""}
                          </span>
                        </div>
                      )}
                      {i.assignedTo && i.assignedTo !== user.name && (
                        <div className="mt-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block">
                          ⓘ You created this — now handled by {i.assignedTo}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <select
                          value={i.status}
                          onChange={(e) => updateLead(i._id, { status: e.target.value })}
                          className="text-[10px] border border-stone-200 rounded-md p-1 bg-white flex-1 min-w-0"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <IconButton label="Chat" onClick={() => openChat(i)} badge={unread > 0}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </IconButton>
                        <IconButton label="View" onClick={() => setSelected(i)}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[720px]">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                      <th className="w-[26%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Client</th>
                      <th className="w-[18%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Created By</th>
                      <th className="w-[18%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Assigned To</th>
                      <th className="w-[16%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Status</th>
                      <th className="w-[14%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Service</th>
                      <th className="w-[8%] px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bdFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-xs text-black/50">
                          No leads match these filters.
                        </td>
                      </tr>
                    ) : bdFiltered.map((i) => {
                      const creator = getCreatorName(i);
                      const role = getCreatorRole(i);
                      const badge = formatCreatorBadge(role);
                      const unread = user ? unreadCountFor(i, user.name) : 0;
                      const createdByMe = (i as any).createdById === user?.userId || (i as any).createdBy === user?.name;
                      const assignedToOther = !!i.assignedTo && i.assignedTo !== user?.name;

                      return (
                        <tr key={i._id} className="hover:bg-stone-50/50">
                          <td className="px-3 py-2">
                            <div className="font-medium text-black text-[12px] truncate flex items-center gap-1">
                              <span className="truncate">{getLeadTitle(i)}</span>
                              {isInternationalLead(i) && (
                                <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                              )}
                            </div>
                            <div className="text-[10px] text-black/50 truncate">{getLeadSubtitle(i)}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[11px] text-stone-700 truncate">{creator}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {i.assignedTo ? (
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[11px] truncate ${i.assignedTo === user?.name ? "text-indigo-700 font-semibold" : "text-stone-800"}`}>
                                  {i.assignedTo}
                                  {i.assignedTo === user?.name ? " (you)" : ""}
                                </span>
                                {createdByMe && assignedToOther && (
                                  <span className="text-[8px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5 inline-block w-fit">
                                    You created · now with {i.assignedTo}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={i.status}
                              onChange={(e) => updateLead(i._id, { status: e.target.value })}
                              className="w-full text-[10px] border border-stone-200 rounded-md p-1 bg-white"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-black/70 truncate">
                            {i.serviceCategory || "General"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <IconButton label="Chat" onClick={() => openChat(i)} badge={unread > 0}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </IconButton>
                              <IconButton label="View" onClick={() => setSelected(i)}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </IconButton>
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

        {/* ─── TOTAL LEADS TAB ─── */}
        {currentTab === "leads" && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <input
                  className="flex-1 min-w-[120px] px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs sm:text-sm text-black focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setOnlyUnread((v) => !v)}
                  aria-pressed={onlyUnread}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    onlyUnread
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 ${onlyUnread ? "text-white" : "text-rose-600"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Unread
                  {totalUnreadLeads > 0 && (
                    <span className={`text-[9px] font-bold min-w-[16px] text-center px-1 py-0.5 rounded-full ${onlyUnread ? "bg-white/25 text-white" : "bg-rose-600 text-white"}`}>
                      {totalUnreadLeads}
                    </span>
                  )}
                </button>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="px-2 py-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-50">
                    Clear ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 bg-white border border-stone-200 rounded-lg p-2">
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-1.5 py-1 border border-stone-300 rounded-md text-[10px] sm:text-xs" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-1.5 py-1 border border-stone-300 rounded-md text-[10px] sm:text-xs" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Created by</label>
                  <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} className="w-full px-1.5 py-1 border border-stone-300 rounded-md text-[10px] sm:text-xs bg-white">
                    <option value="">Anyone</option>
                    {creatorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-1.5 py-1 border border-stone-300 rounded-md text-[10px] sm:text-xs bg-white">
                    <option value="">Any</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-500 mb-0.5 uppercase tracking-wider">Region</label>
                  <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value as any)} className="w-full px-1.5 py-1 border border-stone-300 rounded-md text-[10px] sm:text-xs bg-white">
                    <option value="All">All</option>
                    <option value="Local">Local (PK)</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-0.5 border-b border-stone-200 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                {SERVICE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`shrink-0 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                      filter === tab.value ? "border-indigo-600 text-indigo-700" : "border-transparent text-black/60 hover:text-black hover:border-stone-300"
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] sm:text-[11px] text-stone-500">
              Showing {filtered.length} of {inquiries.length} lead{inquiries.length !== 1 ? "s" : ""}
            </div>

            <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
              <ul className="lg:hidden divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-black/50">No leads match these filters.</li>
                ) : filtered.map((i) => {
                  const creator = getCreatorName(i);
                  const role = getCreatorRole(i);
                  const badge = formatCreatorBadge(role);
                  const unread = user ? unreadCountFor(i, user.name) : 0;
                  return (
                    <li key={i._id} className="px-2.5 py-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="font-semibold text-[11px] text-stone-800 truncate flex items-center gap-1">
                            <span className="truncate">{getLeadTitle(i)}</span>
                            {isInternationalLead(i) && (
                              <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                            )}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">{getLeadSubtitle(i)}</p>
                        </div>
                        {unread > 0 && (
                          <span className="shrink-0 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[8px] font-bold">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-stone-500 flex-wrap">
                        <span className="truncate">{creator}</span>
                        <span className={`px-0.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${badge.cls}`}>{badge.label}</span>
                        <span>·</span>
                        <span className="truncate">{i.serviceCategory || "General"}</span>
                        {i.assignedTo && <span className="truncate ml-auto">→ {i.assignedTo}</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <select
                          value={i.status}
                          onChange={(e) => updateLead(i._id, { status: e.target.value })}
                          className="text-[9px] border border-stone-200 rounded p-0.5 bg-white flex-1 min-w-0"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <IconButton label="Chat" onClick={() => openChat(i)} badge={unread > 0}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </IconButton>
                        <IconButton label="View" onClick={() => setSelected(i)}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </IconButton>
                        {canDeleteLead() && (
                          <IconButton label="Delete" variant="danger" onClick={() => remove(i._id)}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm table-fixed min-w-[720px]">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-left">
                      <th className="w-[26%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Client</th>
                      <th className="w-[18%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Created By</th>
                      <th className="w-[14%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Status</th>
                      <th className="w-[16%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Assigned</th>
                      <th className="w-[14%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider">Service</th>
                      <th className="w-[12%] px-2.5 py-2 font-semibold text-black text-[10px] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-black/50">No leads match these filters.</td></tr>
                    ) : filtered.map((i) => {
                      const creator = getCreatorName(i);
                      const role = getCreatorRole(i);
                      const badge = formatCreatorBadge(role);
                      const editable = canEditLead(i);
                      const unread = user ? unreadCountFor(i, user.name) : 0;
                      return (
                        <tr key={i._id} className="hover:bg-stone-50/50">
                          <td className="px-2.5 py-2 min-w-0">
                            <div className="font-medium text-black text-[12px] truncate flex items-center gap-1">
                              <span className="truncate">{getLeadTitle(i)}</span>
                              {isInternationalLead(i) && (
                                <span className="shrink-0 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Intl</span>
                              )}
                            </div>
                            <div className="text-[10px] text-black/50 truncate">{getLeadSubtitle(i)}</div>
                          </td>
                          <td className="px-2.5 py-2 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[11px] text-stone-700 truncate">{creator}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${badge.cls}`}>{badge.label}</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-2">
                            <select
                              value={i.status}
                              onChange={(e) => updateLead(i._id, { status: e.target.value })}
                              className="w-full text-[10px] border border-stone-200 rounded p-1 bg-white"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-2.5 py-2 min-w-0">
                            {isAdmin ? (
                              <select
                                value={i.assignedTo || ""}
                                onChange={(e) => updateLead(i._id, { assignedTo: e.target.value })}
                                className="w-full text-[10px] border border-stone-200 rounded p-1 bg-white"
                              >
                                <option value="">Unassigned</option>
                                {developers.map((d) => <option key={d._id} value={d.name}>{d.name}</option>)}
                              </select>
                            ) : (
                              <span className="text-[10px] text-black/70 truncate block">{i.assignedTo || "—"}</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2 text-[11px] text-black/70 truncate">{i.serviceCategory || "General"}</td>
                          <td className="px-2.5 py-2">
                            <div className="flex items-center justify-end gap-0.5">
                              <IconButton label="Chat" onClick={() => openChat(i)} badge={unread > 0}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </IconButton>
                              <IconButton label="View" onClick={() => setSelected(i)}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </IconButton>
                              {editable && (
                                <IconButton label="Edit" onClick={() => setSelected(i)}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </IconButton>
                              )}
                              {canDeleteLead() && (
                                <IconButton label="Delete" variant="danger" onClick={() => remove(i._id)}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

        {currentTab === "users" && isAdmin && (
          <UsersPanel currentUserId={user.userId} users={allUsers} reload={loadUsers} />
        )}

        {currentTab === "user-analysis" && isAdmin && (
          <UserAnalysisPanel analysis={analysis} reload={loadAnalysis} onSelectLead={(lead) => setSelected(lead)} />
        )}

        {currentTab === "lead-analysis" && isAdmin && (
          <LeadAnalysisPanel
            onUpdateLead={(lead) => {
              setEditingLead(lead);
              setSelected(null);
            }}
          />
        )}

        {currentTab === "password-requests" && isAdmin && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-black">Password Reset Requests</h2>
            {passwordRequests.length === 0 ? (
              <p className="text-sm text-black/50">No pending password reset requests.</p>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <ul className="lg:hidden divide-y divide-stone-100">
                  {passwordRequests.map((u) => (
                    <li key={u._id} className="px-3 py-2.5">
                      <p className="font-semibold text-xs text-stone-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-stone-500 truncate">{u.email}</p>
                      <p className="text-[9px] text-stone-500 mt-0.5">
                        {u.requestDate ? new Date(u.requestDate).toLocaleString() : "N/A"}
                      </p>
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
                        className="mt-1.5 w-full py-1.5 bg-indigo-600 text-white font-semibold text-[10px] rounded-lg hover:bg-indigo-700"
                      >
                        Reset Password
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm table-fixed min-w-[640px]">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200">
                        <th className="w-[25%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider text-left">Name</th>
                        <th className="w-[35%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider text-left">Email</th>
                        <th className="w-[25%] px-3 py-2 font-semibold text-black text-[10px] uppercase tracking-wider text-left">Requested</th>
                        <th className="w-[15%] px-3 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {passwordRequests.map((u) => (
                        <tr key={u._id} className="hover:bg-stone-50/50">
                          <td className="px-3 py-2 font-medium text-black text-[12px] truncate">{u.name}</td>
                          <td className="px-3 py-2 text-black/70 text-[11px] truncate">{u.email}</td>
                          <td className="px-3 py-2 text-black/50 text-[10px] truncate">{u.requestDate ? new Date(u.requestDate).toLocaleString() : "N/A"}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={async () => {
                                const newPass = prompt(`Enter new temporary password for ${u.name}:`);
                                if (!newPass) return;

                                const res = await fetch("/api/admin/users", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    userId: u._id,
                                    newPassword: newPass,
                                    clearRequest: true,
                                  }),
                                });
                                const json = await res.json();
                                if (json.success) {
                                  alert("Password reset successfully and emailed to user.");
                                  await loadUsers();
                                } else {
                                  alert("Failed: " + json.error);
                                }
                              }}
                              className="px-2 py-1 bg-indigo-600 text-white font-semibold text-[10px] rounded-md hover:bg-indigo-700 whitespace-nowrap"
                            >
                              Reset
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

/* ── IconButton ── */
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
    "relative inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-md border transition-all duration-150 active:scale-95 shrink-0";
  const colors =
    variant === "danger"
      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700";
  return (
    <button onClick={onClick} title={label} aria-label={label} className={`${base} ${colors}`}>
      {children}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
      )}
    </button>
  );
}