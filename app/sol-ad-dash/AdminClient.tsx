"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InquiryDoc, Role, UserDoc, LeadStatus, CommunicationMode } from "@/lib/types";
import CustomSelect from "@/components/CustomSelect";
import Sidebar from "@/components/Sidebar";

type ServiceFilter = "All" | "Automation Software" | "Web Development" | "Logo Design" | "Digital Marketing";

interface SessionUser {
  userId: string;
  username: string;
  role: Role;
  passwordRequest?: boolean;
  newPasswordTemp?: string;
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
  const [filter, setFilter] = useState<ServiceFilter>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InquiryDoc | null>(null);
  const [notesInput, setNotesInput] = useState("");
  
  // Settings Dropdown State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Username, 2: Question, 3: Check Status
  const [forgotUsername, setForgotUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const setView = (newView: string) => {
    router.push(`?tab=${newView}`);
    if (newView === "password-requests") {
      loadUsers();
    }
  };

  // Handle click outside for settings dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== BOOT & POLLING =====
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
          await loadInquiries();
          if (json.user.role === "admin") await loadUsers();
        }
      } catch {} finally { setChecking(false); }
    })();
  }, []);

  // Poll for updates (Admin gets requests, Employee gets new password)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (user.role === "admin") {
        loadUsers();
      }
      
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.user) {
          if (json.user.passwordRequest !== user.passwordRequest || json.user.newPasswordTemp !== user.newPasswordTemp) {
            setUser(json.user);
          }
        }
      } catch {}
    }, 3000); 

    return () => clearInterval(interval);
  }, [user]);

  // ===== AUTH ACTIONS =====
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
      if (meJson.user.role === "admin") await loadUsers();
    } catch (e: any) { setError("Network error: " + e.message); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setInquiries([]); setPassword(""); setUsername("");
  };

  const requestPassword = async () => {
    if (!confirm("Request password reset from Admin?")) return;
    try {
      const res = await fetch("/api/auth/request-password", { method: "POST" });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      
      if (json.success) {
        alert("Password reset requested successfully.");
        setUser(prev => prev ? { ...prev, passwordRequest: true } : null);
      } else {
        alert("Failed: " + (json.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error: Could not connect to server.");
    }
    setSettingsOpen(false);
  };

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true); setForgotMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, action: "get-question" }),
      });
      const json = await res.json();
      if (json.success) {
        setSecurityQuestion(json.question);
        setForgotStep(2);
      } else {
        setForgotMessage({ type: "error", text: json.error });
      }
    } catch (error) {
      console.error("Fetch Error:", error); // <-- Check browser console for this
      setForgotMessage({ type: "error", text: "Network error. Check console." });
    } finally { setForgotLoading(false); }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true); setForgotMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, answer: securityAnswer, action: "request" }),
      });
      const json = await res.json();
      if (json.success) {
        setForgotStep(3);
        setForgotMessage({ type: "success", text: json.message });
      } else {
        setForgotMessage({ type: "error", text: json.error });
      }
    } catch { setForgotMessage({ type: "error", text: "Network error" }); }
    finally { setForgotLoading(false); }
  };

  const handleCheckStatus = async () => {
    setForgotLoading(true); setForgotMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, answer: securityAnswer, action: "check" }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.status === "ready") {
          setRevealedPassword(json.password);
        } else {
          setForgotMessage({ type: "error", text: "Admin hasn't set the password yet. Please wait." });
        }
      } else {
        setForgotMessage({ type: "error", text: json.error });
      }
    } catch { setForgotMessage({ type: "error", text: "Network error" }); }
    finally { setForgotLoading(false); }
  };

  // ===== DATA ACTIONS =====
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

  const updateLead = async (id: string, updates: any) => {
    setInquiries(prev => prev.map(i => i._id === id ? { ...i, ...updates } : i));
    if (selected?._id === id) setSelected(prev => prev ? { ...prev, ...updates } : null);
    
    await fetch("/api/admin/inquiries", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates })
    });
    loadInquiries();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this inquiry permanently?")) return;
    await fetch(`/api/admin/inquiries?id=${id}`, { method: "DELETE" });
    setInquiries((prev) => prev.filter((i) => i._id !== id));
    setSelected(null);
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-black">Loading...</div>;

  // ===== LOGIN SCREEN (with Forgot Password) =====
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9] text-black">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center mb-9">
            <h1 className="text-[24px] font-semibold text-black mt-6 tracking-tight">Sign In</h1>
            <p className="text-[13px] text-black/60 mt-1.5">Manage client inquiries</p>
          </div>
          
          <div className="rounded-none bg-white border border-stone-200 p-6 space-y-4 shadow-sm">
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Username</label>
              <input type="text" className="w-full px-3.5 py-3 text-sm text-black rounded-none border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-black mb-2 uppercase">Password</label>
              <input type="password" className="w-full px-3.5 py-3 text-sm text-black rounded-none border border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
            </div>
            
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsForgotModalOpen(true)} 
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {error && <div className="text-rose-700 text-[12px] bg-rose-50 border border-rose-200 rounded-none px-3 py-2.5">{error}</div>}
            
            <button onClick={login} disabled={loading || !username || !password} className="w-full px-5 py-3 rounded-none font-semibold text-[13px] text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40 flex justify-center items-center gap-2">
              {loading ? "Signing in…" : "Continue"}
            </button>
          </div>
        </div>

        {/* ===== FORGOT PASSWORD MODAL ===== */}
        {isForgotModalOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-none max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h2 className="text-lg font-semibold text-black">Reset Password</h2>
                <button onClick={() => { setIsForgotModalOpen(false); setForgotStep(1); setForgotMessage({type:"",text:""}); setRevealedPassword(null); }} className="text-black/50 hover:text-black text-xl font-bold">✕</button>
              </div>
              
              {revealedPassword ? (
                <div className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-black">Password Ready!</h3>
                  <p className="text-sm text-black/70">Your new temporary password is:</p>
                  <div className="bg-stone-100 border border-stone-300 p-4 font-mono text-xl font-bold text-black select-all">
                    {revealedPassword}
                  </div>
                  <p className="text-xs text-rose-600 font-medium">This will not be shown again!</p>
                  <button onClick={() => { setIsForgotModalOpen(false); setForgotStep(1); setRevealedPassword(null); setPassword(revealedPassword); }} className="w-full py-2 bg-stone-900 text-white font-semibold">Log In Now</button>
                </div>
              ) : forgotStep === 1 ? (
                <form onSubmit={handleGetQuestion} className="p-5 space-y-4">
                  <p className="text-sm text-black/70">Enter your username to retrieve your security question.</p>
                  <input type="text" required className="w-full px-3 py-2 border border-stone-300 rounded-none" placeholder="Username" value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} />
                  {forgotMessage.text && <div className={`text-xs px-3 py-2 border ${forgotMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{forgotMessage.text}</div>}
                  <button type="submit" disabled={forgotLoading || !forgotUsername} className="w-full py-2 bg-indigo-600 text-white font-semibold disabled:opacity-40">{forgotLoading ? "Checking..." : "Next"}</button>
                </form>
              ) : forgotStep === 2 ? (
                <form onSubmit={handleSendRequest} className="p-5 space-y-4">
                  <p className="text-sm font-medium text-black mb-2">{securityQuestion}</p>
                  <input type="text" required className="w-full px-3 py-2 border border-stone-300 rounded-none" placeholder="Your Answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} />
                  {forgotMessage.text && <div className={`text-xs px-3 py-2 border ${forgotMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{forgotMessage.text}</div>}
                  <button type="submit" disabled={forgotLoading || !securityAnswer} className="w-full py-2 bg-indigo-600 text-white font-semibold disabled:opacity-40">{forgotLoading ? "Sending..." : "Send Request"}</button>
                </form>
              ) : (
                <div className="p-5 space-y-4">
                  <p className="text-sm text-black/70">Your request has been sent to the Admin. Once they set your password, click the button below to reveal it.</p>
                  {forgotMessage.text && <div className={`text-xs px-3 py-2 border ${forgotMessage.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{forgotMessage.text}</div>}
                  <button onClick={handleCheckStatus} disabled={forgotLoading} className="w-full py-2 bg-stone-900 text-white font-semibold disabled:opacity-40">{forgotLoading ? "Checking..." : "Check for My New Password"}</button>
                  <button onClick={() => setForgotStep(1)} className="w-full text-xs text-stone-500 hover:underline">Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  // ===== FILTERING =====
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
              {isAdmin ? (currentTab === "dashboard" ? "Dashboard Overview" : currentTab === "leads" ? "Total Leads" : currentTab === "users" ? "User Management" : "Password Requests") : "My Assigned Leads"}
            </h1>
            <p className="text-sm text-black/60 mt-1">Manage and track your client inquiries</p>
          </div>

          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-white border border-stone-200 rounded-none hover:bg-stone-50 transition-colors shadow-sm"
            >
              <div className="w-8 h-8 rounded-none bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-black leading-tight">{user.username}</p>
                <p className="text-[10px] text-black/60 uppercase tracking-wider">{user.role}</p>
              </div>
              <svg className={`w-4 h-4 text-black/50 transition-transform ${settingsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-none shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                  <p className="text-sm font-semibold text-black truncate">{user.username}</p>
                  <p className="text-xs text-black/60 truncate">{user.role === "admin" ? "Administrator" : "Employee"}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button onClick={requestPassword} className="w-full text-left px-3 py-2 text-sm text-black hover:bg-stone-100 rounded-none flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    Request Password Change
                  </button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-none flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ===== PASSWORD NOTIFICATIONS ===== */}
        {user.passwordRequest && !user.newPasswordTemp && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-none text-sm">
            ⏳ Your password reset request is pending admin approval.
          </div>
        )}
        {user.newPasswordTemp && (
          <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-none text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div>
              <p className="font-bold text-emerald-900 mb-1">🔑 Your Password Has Been Reset</p>
              <p>Your new temporary password is: <strong className="font-mono text-lg bg-white px-2 py-0.5 border border-emerald-200">{user.newPasswordTemp}</strong></p>
              <p className="text-xs text-emerald-700 mt-1">Please log out and use this password to sign in.</p>
            </div>
          </div>
        )}

        {/* ===== VIEWS ===== */}
        {(currentTab === "dashboard" && isAdmin) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-stone-200 rounded-none shadow-sm">
                <p className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-black">{inquiries.length}</p>
              </div>
              <div className="bg-white p-5 border border-stone-200 rounded-none shadow-sm">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Assigned</p>
                <p className="text-3xl font-bold text-black">{inquiries.filter(i => i.primaryAssignee).length}</p>
              </div>
              <div className="bg-white p-5 border border-stone-200 rounded-none shadow-sm">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Approved</p>
                <p className="text-3xl font-bold text-black">{inquiries.filter(i => i.status === "Approved").length}</p>
              </div>
              <div className="bg-white p-5 border border-stone-200 rounded-none shadow-sm">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Not Interested</p>
                <p className="text-3xl font-bold text-black">{inquiries.filter(i => i.status === "Not Interested").length}</p>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-black mt-8 mb-3">Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {["Pending", "Interested", "Call Back", "Approved", "Not Interested"].map(status => (
                <div key={status} className="bg-white p-4 border border-stone-200 rounded-none">
                  <p className="text-xs text-black/60 mb-1">{status}</p>
                  <p className="text-xl font-semibold text-black">{inquiries.filter(i => i.status === status).length}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                <table className="w-full text-sm min-w-[700px]">
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
                    ) : filtered.map((i) => (
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
                          {i.primaryAssignee ? (
                            <div>
                              <span className="font-semibold text-indigo-700 block">P: {i.primaryAssignee}</span>
                              {i.secondaryAssignees && i.secondaryAssignees.length > 0 && (
                                <span className="text-black/60 text-[10px]">S: {i.secondaryAssignees.join(", ")}</span>
                              )}
                            </div>
                          ) : <span className="text-black/40">Unassigned</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-black">{i.serviceCategory}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => { setSelected(i); setNotesInput(i.notes || ""); }} className="text-indigo-600 font-medium hover:underline text-xs">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(currentTab === "users" && isAdmin) && (
          <UsersPanel currentUserId={user.userId} users={allUsers} reload={loadUsers} />
        )}

        {(currentTab === "password-requests" && isAdmin) && (
          <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-black">Password Reset Requests</h2>
              <button 
                onClick={loadUsers} 
                className="px-3 py-1.5 bg-stone-100 text-black border border-stone-200 rounded-none text-xs font-medium hover:bg-stone-200 transition-colors"
              >
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
                      <p className="text-xs text-black/60">Requested a password change</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <input type="text" placeholder="New Password" className="px-2 py-1.5 border border-stone-300 rounded-none text-sm text-black w-full sm:w-32 focus:ring-1 focus:ring-indigo-500 outline-none" id={`pass-${u._id}`} />
                       <button onClick={() => {
                         const val = (document.getElementById(`pass-${u._id}`) as HTMLInputElement).value;
                         if(val.length < 6) return alert("Min 6 chars");
                         fetch("/api/admin/users", {
                           method: "PATCH", headers: {"Content-Type": "application/json"},
                           body: JSON.stringify({ userId: u._id, newPassword: val })
                         }).then(() => { alert("Updated"); loadUsers(); });
                       }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-none text-sm font-medium hover:bg-indigo-700 flex-1 sm:flex-none">Set Password</button>
                       <button onClick={() => {
                         fetch("/api/admin/users", {
                           method: "PATCH", headers: {"Content-Type": "application/json"},
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

      {/* ===== DETAIL MODAL ===== */}
      {selected && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-none max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <div>
                <h2 className="text-lg font-semibold text-black">{selected.fullName}</h2>
                <p className="text-xs text-black/60">{selected.email} • {selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-black/50 hover:text-black text-xl font-bold p-1">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                      <div><span className="text-black/60 font-medium block text-xs">Consultant</span> <span className="text-black">{selected.consultantName || "—"}</span></div>
                      <div><span className="text-black/60 font-medium block text-xs">Client Type</span> <span className="text-black">{selected.clientType}</span></div>
                      {selected.companyName && <div><span className="text-black/60 font-medium block text-xs">Company</span> <span className="text-black">{selected.companyName}</span></div>}
                      {selected.designation && <div><span className="text-black/60 font-medium block text-xs">Designation</span> <span className="text-black">{selected.designation}</span></div>}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Project Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                      <div><span className="text-black/60 font-medium block text-xs">Service Requested</span> <span className="text-black font-semibold">{selected.serviceCategory}</span></div>
                      {selected.requirementType && <div><span className="text-black/60 font-medium block text-xs">Requirement Type</span> <span className="text-black">{selected.requirementType}</span></div>}
                      {selected.projectTitle && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Project Title</span> <span className="text-black">{selected.projectTitle}</span></div>}
                      {selected.projectGoals && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Project Goals</span> <span className="text-black">{selected.projectGoals}</span></div>}
                      {selected.targetAudience && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Target Audience</span> <span className="text-black">{selected.targetAudience}</span></div>}
                      {selected.existingWebsite && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Existing Website</span> <span className="text-black">{selected.existingWebsite}</span></div>}
                    </div>
                 </div>

                 {/* Automation specific */}
                 {selected.serviceCategory === "Automation Software" && (
                   <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Automation Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                        {selected.commodityName && <div><span className="text-black/60 font-medium block text-xs">Commodity Name</span> <span className="text-black">{selected.commodityName}</span></div>}
                        {selected.serviceType && <div><span className="text-black/60 font-medium block text-xs">Service Type</span> <span className="text-black">{selected.serviceType}</span></div>}
                        {selected.timeline && <div><span className="text-black/60 font-medium block text-xs">Timeline</span> <span className="text-black">{selected.timeline}</span></div>}
                        {selected.commodityFeatures && selected.commodityFeatures.length > 0 && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Features</span> <span className="text-black">{selected.commodityFeatures.join(", ")}</span></div>}
                        {selected.serviceFeatures && selected.serviceFeatures.length > 0 && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Features</span> <span className="text-black">{selected.serviceFeatures.join(", ")}</span></div>}
                      </div>
                   </div>
                 )}

                 {/* Web Dev specific */}
                 {selected.serviceCategory === "Web Development" && (
                   <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Web Development Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                        {selected.websiteGoal && <div><span className="text-black/60 font-medium block text-xs">Website Goal</span> <span className="text-black">{selected.websiteGoal}</span></div>}
                        {selected.pagesNeeded && <div><span className="text-black/60 font-medium block text-xs">Pages Needed</span> <span className="text-black">{selected.pagesNeeded}</span></div>}
                        {selected.featuresNeeded && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Features Needed</span> <span className="text-black">{selected.featuresNeeded}</span></div>}
                        {selected.businessDescription && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Business Description</span> <span className="text-black">{selected.businessDescription}</span></div>}
                        {selected.usp && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">USP</span> <span className="text-black">{selected.usp}</span></div>}
                      </div>
                   </div>
                 )}

                 {/* Logo specific */}
                 {selected.serviceCategory === "Logo Design" && (
                   <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Logo Design Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                        {selected.logoType && <div><span className="text-black/60 font-medium block text-xs">Logo Type</span> <span className="text-black">{selected.logoType}</span></div>}
                        {selected.colorPreferences && <div><span className="text-black/60 font-medium block text-xs">Color Preferences</span> <span className="text-black">{selected.colorPreferences}</span></div>}
                        {selected.tagline && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Tagline</span> <span className="text-black">{selected.tagline}</span></div>}
                        {selected.logoMessage && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Message / Emotion</span> <span className="text-black">{selected.logoMessage}</span></div>}
                        {selected.audienceDetail && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Audience Details</span> <span className="text-black">{selected.audienceDetail}</span></div>}
                      </div>
                   </div>
                 )}

                 {/* Marketing specific */}
                 {selected.serviceCategory === "Digital Marketing" && (
                   <div>
                      <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Marketing Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                        {selected.brandName && <div><span className="text-black/60 font-medium block text-xs">Brand Name</span> <span className="text-black">{selected.brandName}</span></div>}
                        {selected.natureOfBusiness && <div><span className="text-black/60 font-medium block text-xs">Nature of Business</span> <span className="text-black">{selected.natureOfBusiness}</span></div>}
                        {selected.businessActivities && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Business Activities</span> <span className="text-black">{selected.businessActivities}</span></div>}
                        {selected.majorClients && <div className="sm:col-span-2"><span className="text-black/60 font-medium block text-xs">Major Clients</span> <span className="text-black">{selected.majorClients}</span></div>}
                        {selected.countryWiseMarket && <div><span className="text-black/60 font-medium block text-xs">Country-wise Market</span> <span className="text-black">{selected.countryWiseMarket}</span></div>}
                        {selected.targetAudienceFull && <div><span className="text-black/60 font-medium block text-xs">Target Audience</span> <span className="text-black">{selected.targetAudienceFull}</span></div>}
                      </div>
                   </div>
                 )}

                 {/* Audit Logs */}
                 <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2 border-b border-stone-200 pb-1">Audit Logs</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mt-3">
                      {selected.auditLogs?.length ? selected.auditLogs.map((log, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-indigo-400 pl-3 py-1 bg-stone-50 rounded-none">
                          <p className="text-black font-medium">{log.details}</p>
                          <p className="text-black/60">By {log.performedBy} on {new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      )).reverse() : <p className="text-xs text-black/50">No logs yet.</p>}
                    </div>
                 </div>
              </div>

              {/* Right Column: CRM Controls */}
              <div className="space-y-5 bg-stone-50 p-4 sm:p-5 rounded-none border border-stone-200 h-fit">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1 uppercase tracking-wider">Lead Status</label>
                  <CustomSelect 
                    options={["Interested", "Pending", "Call Back", "Approved", "Not Interested"].map(s => ({ value: s, label: s }))}
                    value={selected.status}
                    onChange={(val) => updateLead(selected._id, { status: val })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1 uppercase tracking-wider">Communication Mode</label>
                  <CustomSelect 
                    options={["Call", "WhatsApp Msg", "WhatsApp Call", "Text Msg", "Email", "Zoom Meeting", "Onsite Meeting"].map(m => ({ value: m, label: m }))}
                    value={selected.communicationMode || ""}
                    onChange={(val) => updateLead(selected._id, { communicationMode: val })}
                    placeholder="Select mode"
                  />
                </div>

                {selected.communicationMode === "Onsite Meeting" && (
                  <div>
                    <label className="block text-[11px] font-bold text-black mb-1 uppercase tracking-wider">Onsite Address</label>
                    <input 
                      className="w-full p-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="Enter address..."
                      value={selected.onsiteAddress || ""}
                      onChange={(e) => setSelected({...selected, onsiteAddress: e.target.value})}
                      onBlur={(e) => updateLead(selected._id, { onsiteAddress: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-black mb-1 uppercase tracking-wider">Internal Notes</label>
                  <textarea 
                    className="w-full p-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24"
                    placeholder="Add notes..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    onBlur={() => updateLead(selected._id, { notes: notesInput })}
                  />
                </div>

                {isAdmin && (
                  <div className="pt-4 border-t border-stone-200">
                    <label className="block text-[11px] font-bold text-indigo-700 mb-1 uppercase tracking-wider">Admin Assignment</label>
                    <label className="block text-[10px] text-black/60 font-medium mb-1">Primary Assignee</label>
                    <CustomSelect 
                      options={[{ value: "", label: "Unassigned" }, ...allUsers.map(u => ({ value: u.username, label: `${u.username} (${u.role})` }))]}
                      value={selected.primaryAssignee || ""}
                      onChange={(val) => updateLead(selected._id, { primaryAssignee: val })}
                    />

                    <label className="block text-[10px] text-black/60 font-medium mt-3 mb-1">Secondary Assignees</label>
                    <div className="space-y-1 bg-white border border-stone-200 rounded-none p-2 max-h-32 overflow-y-auto">
                      {allUsers.filter(u => u.username !== selected.primaryAssignee).map(u => (
                        <label key={u._id} className="flex items-center gap-2 text-sm text-black cursor-pointer hover:bg-stone-50 p-1 rounded-none">
                          <input 
                            type="checkbox" 
                            className="rounded-none border-stone-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selected.secondaryAssignees?.includes(u.username) || false}
                            onChange={(e) => {
                              const current = selected.secondaryAssignees || [];
                              const updated = e.target.checked ? [...current, u.username] : current.filter(x => x !== u.username);
                              updateLead(selected._id, { secondaryAssignees: updated });
                            }}
                          />
                          <span>{u.username}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row gap-3 justify-between">
              <button onClick={() => remove(selected._id)} className="px-4 py-2 text-sm font-medium text-rose-700 bg-white border border-rose-200 rounded-none hover:bg-rose-50 order-2 sm:order-1">Delete Lead</button>
              <a href={`mailto:${selected.email}?subject=Re: Your Inquiry`} className="px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-none hover:bg-stone-800 text-center order-1 sm:order-2">Reply via Email</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= USERS PANEL ================= */
function UsersPanel({ currentUserId, users, reload }: { currentUserId: string, users: UserDoc[], reload: () => void }) {
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("employee");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<Role>("employee");
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const createUser = async () => {
    if (!newQuestion || !newAnswer) {
      setError("Security Question and Answer are required for password recovery.");
      return;
    }
    setError(""); setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword, 
          role: newRole,
          securityQuestion: newQuestion,
          securityAnswer: newAnswer
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || "Failed to create user"); return; }
      setNewUsername(""); setNewPassword(""); setNewRole("employee"); setNewQuestion(""); setNewAnswer("");
      reload();
    } catch (e: any) { setError(e.message); }
    finally { setCreating(false); }
  };

  const removeUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) reload();
    else alert(json.error || "Failed to delete");
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: id, 
          newUsername: editUsername, 
          newRole: editRole,
          newQuestion: editQuestion, // Ensure this state has the value
          newAnswer: editAnswer.trim() !== "" ? editAnswer : undefined 
        }),
      });
      const json = await res.json();
      
      if (json.success) {
        alert("User updated successfully!");
        setEditingUserId(null);
        setEditAnswer(""); 
        reload(); 
      } else {
        alert(json.error || "Failed to update user");
      }
    } catch (e) {
      alert("Network error while saving.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create User Form */}
      <div className="bg-white border border-stone-200 rounded-none p-4 sm:p-5 shadow-sm">
        <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-4">Create New User</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <input className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input type="password" className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <CustomSelect 
            options={[{ value: "employee", label: "Employee" }, { value: "admin", label: "Admin" }]}
            value={newRole}
            onChange={(val) => setNewRole(val as Role)}
          />
          <button onClick={createUser} disabled={creating || !newUsername || !newPassword} className="px-4 py-2 rounded-none text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-40">
            {creating ? "Creating…" : "Create User"}
          </button>
        </div>
        
        {/* Security Question inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Security Question (e.g. What is your pet's name?)" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
          <input className="px-3 py-2 border border-stone-300 rounded-none text-sm text-black focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Security Answer (Required for password recovery)" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
        </div>

        {error && <div className="mt-3 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-none px-3 py-2">{error}</div>}
      </div>

      {/* User List Table */}
      <div className="bg-white border border-stone-200 rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-left">
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Username</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-black uppercase tracking-wider">Security Q</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3.5 font-medium text-black">
                    {editingUserId === u._id ? (
                      <input className="px-2 py-1 border border-stone-300 rounded-none text-sm text-black w-full" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                    ) : (
                      <>
                        {u.username}
                        {u._id === currentUserId && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-none bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">YOU</span>}
                      </>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {editingUserId === u._id ? (
                      <select className="px-2 py-1 border border-stone-300 rounded-none text-sm text-black" value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-none text-[11px] font-medium border ${u.role === "admin" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-stone-100 text-black border-stone-200"}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-black/70">
                    {editingUserId === u._id ? (
                      <div className="flex flex-col gap-1">
                        <input className="px-2 py-1 border border-stone-300 rounded-none text-xs" placeholder="New Question" value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} />
                        <input className="px-2 py-1 border border-stone-300 rounded-none text-xs" placeholder="New Answer" value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                      </div>
                    ) : (
                      u.securityQuestion || <span className="text-rose-500 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-3">
                    {editingUserId === u._id ? (
                      <>
                        <button onClick={() => saveEdit(u._id)} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">Save</button>
                        <button onClick={() => setEditingUserId(null)} className="text-xs font-medium text-stone-500 hover:text-stone-700">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { 
                          setEditingUserId(u._id); 
                          setEditUsername(u.username); 
                          setEditRole(u.role); 
                          setEditQuestion(u.securityQuestion || ""); 
                          setEditAnswer(""); // Keep blank so they only set it if they want to change it
                        }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                        {u._id !== currentUserId && (
                          <button onClick={() => removeUser(u._id, u.username)} className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}