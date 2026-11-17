"use client";
import { useState, useMemo } from "react";
import { InquiryDoc, UserDoc } from "@/lib/types";
import CustomSelect from "./CustomSelect";

const STATUS_OPTIONS = ["Interested", "Pending", "Call Back", "Approved", "Not Interested"];

const STATUS_STYLES: Record<string, string> = {
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Not Interested": "bg-rose-100 text-rose-800 border-rose-200",
  Interested: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Call Back": "bg-amber-100 text-amber-800 border-amber-200",
  Pending: "bg-stone-200 text-stone-800 border-stone-300",
};

export default function ManageLeadModal({
  lead, onClose, onUpdate, onDelete, developers, isAdmin,
}: {
  lead: InquiryDoc;
  onClose: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  developers: UserDoc[];
  isAdmin: boolean;
  currentUser: string;
}) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const saveNotes = async () => {
    if (notes.trim() === (lead.notes || "").trim()) return;
    setSavingNotes(true);
    await onUpdate({ notes: notes.trim() });
    setSavingNotes(false);
  };

  const logs = useMemo(
    () => (lead.auditLogs ? [...lead.auditLogs].reverse() : []),
    [lead.auditLogs]
  );

  return (
    <div
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-[#fafaf9] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl rounded-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HERO HEADER ─────────────────────────────────────── */}
        <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-6 py-5 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                {lead.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {lead.fullName}
                  </h1>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_STYLES[lead.status]}`}>
                    {lead.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {lead.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {lead.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {lead.clientType}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white bg-white/5 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── BODY (SCROLLABLE) ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">

            {/* LEFT: DATA CARDS (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PRIMARY DETAILS GRID */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  General Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <Cell label="Consultant" value={lead.consultantName} />
                  <Cell label="Company" value={lead.companyName} />
                  <Cell label="Designation" value={lead.designation} />
                  <Cell label="Requirement" value={lead.requirementType} />
                  <Cell label="Service" value={lead.serviceCategory} bold />
                  <Cell label="Contact Via" value={lead.preferredContactMethod} />
                  <Cell label="Best Time" value={lead.preferredContactTime} />
                </div>
              </div>

              {/* DYNAMIC SERVICE DETAILS */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {lead.serviceCategory} Details
                </h3>
                
                {lead.serviceCategory === "Automation Software" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Cell label="Commodity" value={lead.commodityName} />
                    <Cell label="Service Type" value={lead.serviceType} />
                    <Cell label="Timeline" value={lead.timeline} />
                    {lead.commodityFeatures?.length ? <Cell label="Features" value={lead.commodityFeatures.join(", ")} block /> : null}
                  </div>
                )}
                
                {lead.serviceCategory === "Web Development" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Cell label="Goal" value={lead.websiteGoal} />
                    <Cell label="Pages" value={lead.pagesNeeded} />
                    <Cell label="Launch Date" value={lead.launchDate} />
                    <Cell label="Existing Site" value={lead.existingWebsite} />
                    {lead.featuresNeeded && <Cell label="Features" value={lead.featuresNeeded} block />}
                  </div>
                )}

                {lead.serviceCategory === "Logo Design" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Cell label="Logo Type" value={lead.logoType} />
                    <Cell label="Colors" value={lead.colorPreferences} />
                    <Cell label="Tagline" value={lead.tagline} />
                    <Cell label="Message" value={lead.logoMessage} block />
                  </div>
                )}

                {lead.serviceCategory === "Digital Marketing" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Cell label="Brand Name" value={lead.brandName} />
                    <Cell label="Nature" value={lead.natureOfBusiness} />
                    <Cell label="Target Audience" value={lead.targetAudienceFull} block />
                  </div>
                )}
              </div>

              {/* PROJECT BRIEF & NOTES */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Project Brief
                </h3>
                <div className="space-y-4">
                  {lead.projectTitle && <Cell label="Title" value={lead.projectTitle} bold />}
                  {lead.projectGoals && <Cell label="Goals" value={lead.projectGoals} block />}
                  {lead.targetAudience && <Cell label="Target Audience" value={lead.targetAudience} block />}
                  {lead.additionalNotes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Additional Notes</p>
                      <p className="text-[13px] text-amber-900 leading-relaxed whitespace-pre-wrap">{lead.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TIMELINE */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setTimelineOpen(!timelineOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-stone-50 transition-colors"
                >
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Activity History ({logs.length})
                  </h3>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform ${timelineOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {timelineOpen && (
                  <div className="border-t border-stone-200 bg-stone-50/50 max-h-64 overflow-y-auto">
                    {logs.map((log, i) => {
                      const isNote = log.action === "Note";
                      return (
                        <div key={i} className="flex gap-4 p-4 border-b border-stone-100 last:border-0 hover:bg-white transition-colors">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${isNote ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-indigo-50 border-indigo-200 text-indigo-600"}`}>
                             {isNote ? "📝" : "⚙️"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isNote ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>{log.action}</span>
                              <span className="text-[10px] font-medium text-stone-400">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-stone-700">{log.details}</p>
                            <p className="text-[10px] text-stone-400 mt-1">by {log.performedBy}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT: CONTROLS & ACTIONS (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sticky top-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Lead Status</label>
                  <CustomSelect
                    options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                    value={lead.status}
                    onChange={(v) => onUpdate({ status: v })}
                  />
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Assigned To</label>
                    <CustomSelect
                      options={[
                        { value: "", label: "Unassigned" },
                        ...developers.map((u) => ({ value: u.username, label: u.username })),
                      ]}
                      value={lead.assignedTo || ""}
                      onChange={(v) => onUpdate({ assignedTo: v })}
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Internal Notes</label>
                  <textarea
                    className="w-full p-3 border border-stone-200 rounded-lg text-sm text-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-32 resize-none leading-relaxed bg-stone-50"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add private notes about this lead..."
                  />
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="mt-2 w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 shadow-sm transition-colors"
                  >
                    {savingNotes ? "Saving..." : "Save Note"}
                  </button>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-3">Metadata</p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Created</span>
                      <span className="font-medium text-stone-700">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Updated</span>
                      <span className="font-medium text-stone-700">{new Date(lead.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {lead.submissionLocation?.ip && (
                      <div className="flex justify-between">
                        <span className="text-stone-400">IP</span>
                        <span className="font-mono text-stone-700">{lead.submissionLocation.ip}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex justify-between shrink-0">
          {isAdmin ? (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Delete Lead
            </button>
          ) : <span />}
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── UI PRIMITIVES ────────────────────────────────────── */

function Cell({ label, value, bold, block }: { label: string; value?: string; bold?: boolean; block?: boolean }) {
  if (!value) return null;
  return (
    <div className={block ? "col-span-full" : ""}>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-stone-800 ${bold ? "font-semibold" : "font-medium"} text-[13px] ${block ? "whitespace-pre-wrap leading-relaxed bg-stone-50 p-3 rounded-md border border-stone-100" : ""}`}>
        {value}
      </p>
    </div>
  );
}