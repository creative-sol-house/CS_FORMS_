"use client";
import { SessionUser } from "@/lib/types";

interface SidebarProps {
  user: SessionUser;
  view: string;
  setView: (view: any) => void;
  passwordRequestCount: number;
  logout: () => void;
}

export default function Sidebar({ user, view, setView, passwordRequestCount, logout }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "leads", label: "Total Leads", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "users", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "password-requests", label: "Password Requests", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col fixed inset-y-0 h-full z-40">
      <div className="p-6 border-b border-stone-200">
        <h1 className="text-xl font-bold text-black tracking-tight">CRM System</h1>
        <p className="text-xs text-black/60 mt-1">Admin Portal</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === item.id ? "bg-indigo-50 text-indigo-700" : "text-black hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </div>
            {item.id === "password-requests" && passwordRequestCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{passwordRequestCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user.username}</p>
            <p className="text-[10px] text-black/60 uppercase tracking-wider">{user.role}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full px-3 py-2 text-xs font-medium text-black bg-stone-100 rounded-md hover:bg-stone-200 transition-colors">
          Sign Out
        </button>
      </div>
    </aside>
  );
}