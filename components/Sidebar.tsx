"use client";
import { useState } from "react";
import { SessionUser } from "@/lib/types";

interface SidebarProps {
  user: SessionUser;
  view: string;
  setView: (view: any) => void;
  passwordRequestCount: number;
  logout: () => void;
}

export default function Sidebar({ user, view, setView, passwordRequestCount, logout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "leads", label: "Total Leads", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "users", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    
    { id: "user-analysis", label: "User Analysis", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    {
  id: "lead-analysis",
  label: "Lead Analysis",
  icon: "M3 3v18h18M18 17V9M13 17V5M8 17v-3"
},
    { id: "password-requests", label: "Password Requests", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  ];

  const handleNavClick = (id: string) => {
    setView(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-stone-200 rounded-md shadow-sm text-black"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col h-full 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        
        <div className="lg:hidden absolute top-4 right-4">
          <button onClick={() => setIsOpen(false)} className="text-black/50 hover:text-black p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 border-b border-stone-200">
          <h1 className="text-xl font-bold text-black tracking-tight">CRM System</h1>
          <p className="text-xs text-black/60 mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
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
            {/* CLOUDINARY AVATAR */}
            <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-black truncate">{user.name}</p>
              <p className="text-[10px] text-black/60 uppercase tracking-wider truncate">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <button onClick={logout} className="w-full px-3 py-2 text-xs font-medium text-black bg-stone-100 rounded-md hover:bg-stone-200 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}