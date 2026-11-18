"use client";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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

/* ─────────────── Portal helper ─────────────── */
function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function ManageLeadModal({
  lead,
  onClose,
  onUpdate,
  onDelete,
  developers,
  isAdmin,
  currentUser,
  canEdit,
  canDelete,
  onEdit,
}: {
  lead: InquiryDoc;
  onClose: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  developers: UserDoc[];
  isAdmin: boolean;
  currentUser: string;
  canEdit: boolean;
  canDelete: boolean;
  /** Opens the full-field LeadForm in edit mode (handled by parent) */
  onEdit: () => void;
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

  const creatorName =
    (lead as any).createdBy ||
    lead.auditLogs?.find((l) => l.action === "Created")?.performedBy ||
    lead.consultantName ||
    "Unknown";

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ─────────── SCREEN-ONLY MODAL ─────────── */}
      <div
        className="screen-only fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 z-50 transition-opacity"
        onClick={onClose}
      >
        <div
          className="bg-[#fafaf9] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl rounded-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
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
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_STYLES[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-300 font-medium flex-wrap">
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
                  <div className="mt-2 text-xs text-stone-400">
                    Created by <span className="font-semibold text-stone-200">{creatorName}</span>{" "}
                    on {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
              {canEdit && (
  <button
    onClick={onEdit}
    className="text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
    title="Edit all fields"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
    Edit Lead
  </button>
)}

                <button
                  onClick={handlePrint}
                  className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg backdrop-blur-md transition-all text-xs font-semibold flex items-center gap-1.5 border border-white/15"
                  title="Print professional lead form"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
                  </svg>
                  Print Form
                </button>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white bg-white/5 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              {/* LEFT: DATA */}
              <div className="lg:col-span-8 space-y-6">
                {/* General info */}
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

                {/* Service details */}
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
                      {lead.commodityFeatures?.length ? (
                        <Cell label="Features" value={lead.commodityFeatures.join(", ")} block />
                      ) : null}
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

                {/* Brief */}
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

                {/* Activity */}
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
              {/* RIGHT: CONTROLS */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sticky top-6 space-y-5">
                  
                  {/* STATUS - Always editable */}
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Lead Status</label>
                    <CustomSelect
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                      value={lead.status}
                      onChange={(v) => onUpdate({ status: v })}
                    />
                  </div>

                  {/* ASSIGNMENT - Admin only */}
                  {isAdmin && (
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Assigned To</label>
                      <CustomSelect
                        options={[{ value: "", label: "Unassigned" }, ...developers.map((u) => ({ value: u.name, label: u.name }))]}
                        value={lead.assignedTo || ""}
                        onChange={(v) => onUpdate({ assignedTo: v })}
                      />
                    </div>
                  )}

                  {/* NOTES - Always editable */}
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
                  
                  {/* METADATA goes here... */}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-stone-200 bg-white flex justify-between shrink-0">
            {canDelete ? (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                Delete Lead
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>

      {/* ─────────── PRINT-ONLY PAPER FORM (portaled to body) ─────────── */}
      <PrintPortal>
        <PrintSheet lead={lead} creatorName={creatorName} currentUser={currentUser} />
      </PrintPortal>
    </>
  );
}

/* ─────────────── Print sheet (professional paper-form layout) ─────────────── */
function PrintSheet({
  lead,
  creatorName,
  currentUser,
}: {
  lead: InquiryDoc;
  creatorName: string;
  currentUser: string;
}) {
  const sections = buildPrintSections(lead);

  return (
    <>
      {/* Self-contained print CSS */}
      <style>{`
        #print-area {
          display: none;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 14mm 16mm 14mm;
          }
          html, body {
            background: #ffffff !important;
            color: #111827 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide everything except the print portal */
          body > *:not(#print-area) {
            display: none !important;
          }
          #print-area {
            display: block !important;
            width: 100% !important;
          }
          .pf-container {
            width: 100%;
            max-width: 100%;
          }
          .pf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #18181b;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .pf-doc-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #52525b;
            margin-bottom: 3px;
          }
          .pf-title {
            font-size: 20px;
            font-weight: 800;
            color: #09090b;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .pf-subtitle {
            font-size: 11px;
            color: #52525b;
            margin-top: 3px;
          }
          .pf-meta-box {
            border: 1px solid #d4d4d8;
            background: #fafafa;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 10.5px;
            line-height: 1.5;
            min-width: 195px;
          }
          .pf-meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }
          .pf-meta-key {
            color: #71717a;
            font-weight: 600;
          }
          .pf-meta-val {
            color: #18181b;
            font-weight: 700;
          }
          .pf-section {
            margin-bottom: 14px;
            break-inside: avoid;
          }
          .pf-section-header {
            background: #18181b;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 5px 10px;
            border-radius: 3px 3px 0 0;
          }
          .pf-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .pf-table tr {
            break-inside: avoid;
          }
          .pf-table th,
          .pf-table td {
            border: 1px solid #d4d4d8;
            padding: 6px 10px;
            font-size: 11px;
            vertical-align: top;
            text-align: left;
            word-wrap: break-word;
          }
          .pf-table th {
            width: 28%;
            background: #f4f4f5;
            color: #3f3f46;
            font-weight: 600;
          }
          .pf-table td {
            width: 72%;
            color: #18181b;
            white-space: pre-wrap;
          }
          .pf-notes-box {
            border: 1px solid #d4d4d8;
            border-top: none;
            padding: 10px;
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
            background: #ffffff;
            min-height: 44px;
          }
          .pf-signatures {
            display: flex;
            justify-content: space-between;
            gap: 32px;
            margin-top: 28px;
            break-inside: avoid;
          }
          .pf-sign-block {
            flex: 1;
          }
          .pf-sign-line {
            border-bottom: 1px solid #18181b;
            height: 28px;
            margin-bottom: 5px;
          }
          .pf-sign-caption {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #52525b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }
      `}</style>

      <div id="print-area">
        <div className="pf-container">
          {/* FORM HEADER */}
          <div className="pf-header">
            <div>
              <div className="pf-doc-label">Official Client Record</div>
              <h1 className="pf-title">Client Lead Intake Form</h1>
              <div className="pf-subtitle">
                Printed by {currentUser || creatorName} &bull; {new Date().toLocaleString()}
              </div>
            </div>

            <div className="pf-meta-box">
              <div className="pf-meta-row">
                <span className="pf-meta-key">Lead ID:</span>
                <span className="pf-meta-val">
                  {(lead as any)._id ? String((lead as any)._id).slice(-8).toUpperCase() : "N/A"}
                </span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Status:</span>
                <span className="pf-meta-val">{lead.status}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Category:</span>
                <span className="pf-meta-val">{lead.serviceCategory || "—"}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Assigned To:</span>
                <span className="pf-meta-val">{lead.assignedTo || "Unassigned"}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Created Date:</span>
                <span className="pf-meta-val">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* FORM SECTIONS */}
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="pf-section">
              <div className="pf-section-header">{section.title}</div>
              <table className="pf-table">
                <tbody>
                  {section.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <th>{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* INTERNAL NOTES */}
          <div className="pf-section">
            <div className="pf-section-header">Internal Consultation Notes</div>
            <div className="pf-notes-box">
              {lead.notes?.trim() ? lead.notes : "No internal notes recorded."}
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="pf-signatures">
            <div className="pf-sign-block">
              <div className="pf-sign-line" />
              <div className="pf-sign-caption">
                <span>Prepared By ({creatorName})</span>
                <span>Date</span>
              </div>
            </div>
            <div className="pf-sign-block">
              <div className="pf-sign-line" />
              <div className="pf-sign-caption">
                <span>Approved / Reviewed By</span>
                <span>Date</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────── Group lead fields into structured form sections ─────────────── */
function buildPrintSections(lead: InquiryDoc): {
  title: string;
  rows: { label: string; value: string }[];
}[] {
  const makeSection = (title: string) => {
    const rows: { label: string; value: string }[] = [];
    const add = (label: string, v?: string | string[] | null) => {
      if (Array.isArray(v)) {
        if (v.length > 0) rows.push({ label, value: v.join(", ") });
      } else if (v !== undefined && v !== null && String(v).trim() !== "") {
        rows.push({ label, value: String(v).trim() });
      }
    };
    return { title, rows, add };
  };

  // 1. Client & Contact Information
  const clientSec = makeSection("1. Client & Contact Information");
  clientSec.add("Full Name", lead.fullName);
  clientSec.add("Client Type", lead.clientType);
  clientSec.add("Email Address", lead.email);
  clientSec.add("Phone Number", lead.phone);
  clientSec.add("Company / Organization", lead.companyName);
  clientSec.add("Designation / Role", lead.designation);
  clientSec.add("Preferred Contact Method", lead.preferredContactMethod);
  clientSec.add("Preferred Contact Time", lead.preferredContactTime);
  clientSec.add("Consultant Name", lead.consultantName);

  // 2. Project Overview
  const projectSec = makeSection("2. Project Overview");
  projectSec.add("Requirement Type", lead.requirementType);
  projectSec.add("Service Category", lead.serviceCategory);
  projectSec.add("Project Title", lead.projectTitle);
  projectSec.add("Project Goals", lead.projectGoals);
  projectSec.add("Target Audience", lead.targetAudience);
  projectSec.add("Existing Website", lead.existingWebsite);
  projectSec.add("Additional Client Notes", lead.additionalNotes);

  // 3. Service-Specific Requirements
  const serviceSec = makeSection(`3. ${lead.serviceCategory || "Service"} Specifications`);

  if (lead.serviceCategory === "Automation Software") {
    serviceSec.add("Commodity Type", lead.commodityType);
    serviceSec.add("Commodity Name", lead.commodityName);
    serviceSec.add("Commodity Features", lead.commodityFeatures);
    serviceSec.add("Commodity Delivery", lead.commodityDelivery);
    serviceSec.add("Commodity References", lead.commodityRefs);
    serviceSec.add("Service Type", lead.serviceType);
    serviceSec.add("Project Description", lead.projectDescription);
    serviceSec.add("Service Features", lead.serviceFeatures);
    serviceSec.add("Estimated Timeline", lead.timeline);
    serviceSec.add("Service References", lead.serviceRefs);
  }

  if (lead.serviceCategory === "Web Development") {
    serviceSec.add("Pages Needed", lead.pagesNeeded);
    serviceSec.add("Features Needed", lead.featuresNeeded);
    serviceSec.add("Website Goal", lead.websiteGoal);
    serviceSec.add("Target Launch Date", lead.launchDate);
    serviceSec.add("Reference Websites", lead.referenceWebsites);
    serviceSec.add("Additional Suggestions", lead.additionalSuggestions);
  }

  if (lead.serviceCategory === "Logo Design") {
    serviceSec.add("Brand Name", lead.brandName);
    serviceSec.add("Tagline", lead.tagline);
    serviceSec.add("Nature of Business", lead.natureOfBusiness);
    serviceSec.add("Logo Type", lead.logoType);
    serviceSec.add("Business Description", lead.businessDescription);
    serviceSec.add("Unique Selling Proposition (USP)", lead.usp);
    serviceSec.add("Color Preferences", lead.colorPreferences);
    serviceSec.add("Liked Logos", lead.likedLogos);
    serviceSec.add("Competitor Branding", lead.competitorBranding);
    serviceSec.add("Audience Detail", lead.audienceDetail);
    serviceSec.add("Logo Message", lead.logoMessage);
  }

  if (lead.serviceCategory === "Digital Marketing") {
    serviceSec.add("Brand Name", lead.brandName);
    serviceSec.add("Nature of Business", lead.natureOfBusiness);
    serviceSec.add("Business Activities", lead.businessActivities);
    serviceSec.add("Major Clients", lead.majorClients);
    serviceSec.add("Country-Wise Market", lead.countryWiseMarket);
    serviceSec.add("Target Audience (Full)", lead.targetAudienceFull);
    serviceSec.add("Business Keywords", lead.businessKeywords50);
    serviceSec.add("Total Products", lead.totalProducts);
    serviceSec.add("Top-Rated Products", lead.topRatedProducts);
    serviceSec.add("Top Product Keywords", lead.topProductKeywords);
    serviceSec.add("Important Page / Product", lead.importantPageOrProduct);
    serviceSec.add("Social Media Credentials", lead.socialMediaCredentials);
    serviceSec.add("Sample Banners", lead.sampleBanners);
    serviceSec.add("Sample Blogs", lead.sampleBlogs);
    serviceSec.add("Sample Copywriting", lead.sampleCopywriting);
    serviceSec.add("GSC Details", lead.gscDetails);
    serviceSec.add("Dynamic URL Recommendations", lead.dynamicUrlRecs);
    serviceSec.add("Existing Search Submissions", lead.existingSearchSubmissions);
    serviceSec.add("Relevant Links", lead.relevantLink);
    serviceSec.add("Community Engagements", lead.communityEngagements);
    serviceSec.add("SERP Positioning", lead.serpPositioning);
    serviceSec.add("Competitor Names / URLs", lead.competitorNamesUrls);
  }

  return [clientSec, projectSec, serviceSec].filter((s) => s.rows.length > 0);
}

/* ── UI primitives ── */
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