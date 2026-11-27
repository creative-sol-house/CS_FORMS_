"use client";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { InquiryDoc, UserDoc, LeadAttachment } from "@/lib/types";
import CustomSelect from "./CustomSelect";
import IndustrySelect from "./IndustrySelect";

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

/* ✅ NEW — shared helper so the badge logic is identical everywhere */
function isInternational(lead: InquiryDoc): boolean {
  if (typeof (lead as any).isInternationalClient === "boolean") {
    return (lead as any).isInternationalClient;
  }
  const country = (lead as any).country?.trim?.();
  return !!country && country !== "Pakistan";
}

/* ✅ NEW — company-first display name */
function getLeadDisplayTitle(lead: InquiryDoc): string {
  const company = (lead as any).companyName?.trim?.();
  if (lead.clientType === "Business" && company) return company;
  return lead.fullName || "Unnamed Lead";
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
  onEdit: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  // ✅ Industry — local mirror so the modal reflects changes immediately
  const [industry, setIndustry] = useState<string>((lead as any).industry || "");
  const [savingIndustry, setSavingIndustry] = useState(false);
  const [industryErr, setIndustryErr] = useState("");

  useEffect(() => {
    setIndustry((lead as any).industry || "");
  }, [(lead as any).industry]);

  const saveNotes = async () => {
    if (notes.trim() === (lead.notes || "").trim()) return;
    setSavingNotes(true);
    await onUpdate({ notes: notes.trim() });
    setSavingNotes(false);
  };

  // ✅ Industry save — server returns 409 when a similar name exists; retry with force.
  const saveIndustry = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed === ((lead as any).industry || "").trim()) return;

    setSavingIndustry(true);
    setIndustryErr("");
    try {
      const doFetch = (force: boolean) =>
        fetch("/api/admin/inquiries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: lead._id,
            updates: force
              ? { industry: trimmed, forceIndustry: true }
              : { industry: trimmed },
          }),
        }).then((r) => r.json());

      let json = await doFetch(false);

      if (!json.success && json.needsConfirmation) {
        if (confirm(json.error)) {
          json = await doFetch(true);
        } else {
          // user cancelled — revert input to previous value
          setIndustry((lead as any).industry || "");
          return;
        }
      }

      if (!json.success) throw new Error(json.error || "Failed to save industry");

      // onUpdate triggers parent refresh (also updates via SSE)
      onUpdate({ industry: trimmed });
    } catch (e: any) {
      setIndustryErr(e.message);
      setIndustry((lead as any).industry || "");
    } finally {
      setSavingIndustry(false);
    }
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

  const handlePrint = () => window.print();

  // Attachments already conform to LeadAttachment — just default to [] if absent
  const attachments: LeadAttachment[] = useMemo(
    () => (lead.attachments as LeadAttachment[]) || [],
    [lead.attachments]
  );

  // ✅ Region helpers
  const intl = isInternational(lead);
  const regionLabel: "Local" | "International" =
    ((lead as any).clientRegion as "Local" | "International" | undefined) ||
    (intl ? "International" : "Local");
  const displayTitle = getLeadDisplayTitle(lead);

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
          <div className="relative bg-linear-to-r from-stone-900 via-stone-800 to-stone-900 px-6 py-5 shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                  {displayTitle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    {/* ✅ Company-first title + Intl badge */}
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <span className="truncate">{displayTitle}</span>
                      {intl && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-300/40">
                          Intl
                        </span>
                      )}
                    </h1>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_STYLES[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  {/* ✅ If business, show client name under the company title */}
                  {lead.clientType === "Business" && displayTitle !== lead.fullName && (
                    <div className="text-sm text-stone-300 font-medium mb-1">
                      Contact: <span className="text-white">{lead.fullName}</span>
                    </div>
                  )}

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
                    {/* ✅ NEW — Industry */}
                    <Cell label="Industry" value={(lead as any).industry} bold />
                    <Cell label="Contact Via" value={lead.preferredContactMethod} />
                    <Cell label="Best Time" value={lead.preferredContactTime} />
                    <Cell
                      label="Lead Created"
                      value={lead.leadCreatedAt ? new Date(lead.leadCreatedAt).toLocaleString() : undefined}
                    />

                    {/* ✅ NEW — Country / Location / Region */}
                    <Cell label="Country" value={(lead as any).country} />
                    <Cell label="Location" value={(lead as any).location} />
                    <Cell
                      label="Region"
                      value={regionLabel}
                      bold
                    />
                  </div>
                </div>

                {/* ALL USER-SUBMITTED INFORMATION */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                  <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a2 2 0 01.707.293l5.414 5.414a2 2 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    All Submitted Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {getVisibleLeadFields(lead).map(([key, value]) => (
                      <Cell
                        key={key}
                        label={formatFieldLabel(key)}
                        value={formatFieldValue(value)}
                        block={isLongField(key, value)}
                      />
                    ))}
                    {getVisibleLeadFields(lead).length === 0 && (
                      <p className="text-sm text-stone-400 col-span-full">No additional information was submitted.</p>
                    )}
                  </div>
                </div>
                {/* ✅ NEW: Dedicated Social Links Section */}
                {lead.socialLinks && lead.socialLinks.length > 0 && (
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                    <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Social Links
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.socialLinks.map((l, i) => {
                        // Ensure the URL has https:// so it actually redirects
                        const url = l.url 
                          ? (l.url.startsWith("http") ? l.url : `https://${l.url}`) 
                          : "#";
                        
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all group"
                            title={l.url}
                          >
                            <SocialIcon name={l.name} />
                            <span className="text-xs font-semibold text-stone-700 group-hover:text-indigo-700">
                              {l.name || "Link"}
                            </span>
                            <svg className="w-3 h-3 text-stone-400 group-hover:text-indigo-500 ml-1 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ─────────── ATTACHMENTS ─────────── */}
                {attachments.length > 0 && (
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attachments ({attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((file, i) => (
                        <AttachmentCard key={file.publicId || i} file={file} />
                      ))}
                    </div>
                  </div>
                )}

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
                              <div className="text-sm text-stone-700 space-y-1">
                                {(log.details || "").split(" · ").map((part, j) => (
                                  <div key={j} className="flex items-start gap-2">
                                    <span className="text-stone-400 mt-0.5">•</span>
                                    <span className="break-words">{part}</span>
                                  </div>
                                ))}
                              </div>
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
                        options={[{ value: "", label: "Unassigned" }, ...developers.map((u) => ({ value: u.name, label: u.name }))]}
                        value={lead.assignedTo || ""}
                        onChange={(v) => onUpdate({ assignedTo: v })}
                      />
                    </div>
                  )}

                  {/* ✅ NEW — Industry (inline edit) */}
                  <div className="pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Industry
                      </label>
                      {savingIndustry && (
                        <span className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                      )}
                    </div>
                    <IndustrySelect
                      value={industry}
                      disabled={savingIndustry || !canEdit}
                      onChange={(v) => {
                        setIndustry(v);
                        saveIndustry(v);
                      }}
                    />
                    {industryErr && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">{industryErr}</p>
                    )}
                  </div>

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
        <PrintSheet
          lead={lead}
          attachments={attachments}
          creatorName={creatorName}
          currentUser={currentUser}
        />
      </PrintPortal>
    </>
  );
}

function AttachmentCard({ file }: { file: LeadAttachment }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isImage = file.fileType?.startsWith("image/");
  const isPdf =
    file.fileType === "application/pdf" ||
    file.url?.toLowerCase().endsWith(".pdf");

  const viewUrl = file.publicId
    ? `/api/attachments/${encodeURIComponent(file.publicId)}`
    : file.url || "";

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-stone-50/60 hover:bg-stone-100/70 transition-colors group">
        <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
          {isImage && file.url ? (
            <img src={file.url} alt={file.fileName} className="w-full h-full object-cover" />
          ) : (
            <FileTypeIcon type={file.fileType} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-800 truncate" title={file.fileName}>
            {file.fileName || "Attachment"}
          </p>
          <p className="text-[11px] text-stone-500">
            {formatBytes(file.fileSize)}
            {file.fileType ? ` · ${shortType(file.fileType)}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Download — always available */}
          <a
            href={viewUrl}
            download={file.fileName}
            className="p-1.5 rounded-md text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </a>
        </div>
      </div>

      {previewOpen && (
        <AttachmentPreviewModal file={file} viewUrl={viewUrl} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}

function AttachmentPreviewModal({
  file,
  viewUrl,
  onClose,
}: {
  file: LeadAttachment;
  viewUrl: string;
  onClose: () => void;
}) {
  const isImage = file.fileType?.startsWith("image/");
  const isPdf =
    file.fileType === "application/pdf" || file.url?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-stone-900 text-white shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{file.fileName}</p>
          <p className="text-[11px] text-stone-400">{formatBytes(file.fileSize)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={viewUrl}
            download={file.fileName}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Download
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={file.url}
            alt={file.fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        )}
        {isPdf && (
          <iframe
            src={`${viewUrl}#toolbar=1&navpanes=0`}
            title={file.fileName}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
          />
        )}
        {!isImage && !isPdf && (
          <div className="text-center text-white max-w-md">
            <FileTypeIcon type={file.fileType} size="lg" />
            <p className="mt-4 text-lg font-semibold">Preview not available</p>
            <p className="mt-1 text-sm text-stone-300">
              This file type can't be previewed in the browser. Open or download it instead.
            </p>
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold"
            >
              Open in new tab
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
    >
      {children}
    </button>
  );
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function shortType(mime: string) {
  if (!mime) return "FILE";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || mime.includes("doc")) return "DOCX";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("xls")) return "XLSX";
  if (mime.startsWith("image/")) return mime.split("/")[1].toUpperCase();
  return "FILE";
}

function FileTypeIcon({ type, size = "sm" }: { type?: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-16 h-16" : "w-5 h-5";
  const t = (type || "").toLowerCase();
  const color = t.includes("pdf")
    ? "text-rose-500"
    : t.includes("word") || t.includes("doc")
    ? "text-blue-500"
    : t.includes("sheet") || t.includes("excel") || t.includes("xls")
    ? "text-emerald-500"
    : "text-stone-400";
  return (
    <svg className={`${cls} ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

/* ─────────────── Print sheet ─────────────── */
function PrintSheet({
  lead,
  attachments,
  creatorName,
  currentUser,
}: {
  lead: InquiryDoc;
  attachments: LeadAttachment[];
  creatorName: string;
  currentUser: string;
}) {
  const sections = buildPrintSections(lead);
  const imageAttachments = attachments.filter((f) => f.fileType?.startsWith("image/"));
  const otherAttachments = attachments.filter((f) => !f.fileType?.startsWith("image/"));

  // ✅ Region for print
  const printIntl = isInternational(lead);
  const printRegionLabel =
    (lead as any).clientRegion ||
    (printIntl ? "International" : "Local");

  return (
    <>
      <style>{`
        #print-area { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 14mm 14mm 16mm 14mm; }
          html, body {
            background: #ffffff !important;
            color: #111827 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            overflow: visible !important;
          }
          body > *:not(#print-area) { display: none !important; }
          #print-area { display: block !important; width: 100% !important; }
          .pf-container { width: 100%; max-width: 100%; }
          .pf-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 2px solid #18181b; padding-bottom: 12px; margin-bottom: 16px;
          }
          .pf-doc-label {
            font-size: 9px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.12em; color: #52525b; margin-bottom: 3px;
          }
          .pf-title { font-size: 20px; font-weight: 800; color: #09090b; margin: 0; letter-spacing: -0.02em; }
          .pf-subtitle { font-size: 11px; color: #52525b; margin-top: 3px; }
          .pf-meta-box {
            border: 1px solid #d4d4d8; background: #fafafa; padding: 8px 12px;
            border-radius: 4px; font-size: 10.5px; line-height: 1.5; min-width: 195px;
          }
          .pf-meta-row { display: flex; justify-content: space-between; gap: 12px; }
          .pf-meta-key { color: #71717a; font-weight: 600; }
          .pf-meta-val { color: #18181b; font-weight: 700; }
          .pf-section { margin-bottom: 14px; break-inside: avoid; }
          .pf-section-header {
            background: #18181b; color: #ffffff; font-size: 10px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 10px;
            border-radius: 3px 3px 0 0;
          }
          .pf-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .pf-table tr { break-inside: avoid; }
          .pf-table th, .pf-table td {
            border: 1px solid #d4d4d8; padding: 6px 10px; font-size: 11px;
            vertical-align: top; text-align: left; word-wrap: break-word;
          }
          .pf-table th { width: 28%; background: #f4f4f5; color: #3f3f46; font-weight: 600; }
          .pf-table td { width: 72%; color: #18181b; white-space: pre-wrap; }
          .pf-notes-box {
            border: 1px solid #d4d4d8; border-top: none; padding: 10px;
            font-size: 11px; line-height: 1.5; white-space: pre-wrap;
            background: #ffffff; min-height: 44px;
          }
          .pf-attach-image-box {
            border: 1px solid #d4d4d8; padding: 8px; text-align: center;
            background: #ffffff; break-inside: avoid;
          }
          .pf-attach-image { max-width: 100%; max-height: 380px; object-fit: contain; }
          .pf-signatures {
            display: flex; justify-content: space-between; gap: 32px;
            margin-top: 28px; break-inside: avoid;
          }
          .pf-sign-block { flex: 1; }
          .pf-sign-line { border-bottom: 1px solid #18181b; height: 28px; margin-bottom: 5px; }
          .pf-sign-caption {
            display: flex; justify-content: space-between; font-size: 9.5px;
            color: #52525b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
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
              {/* ✅ NEW — Industry in print metadata */}
              <div className="pf-meta-row">
                <span className="pf-meta-key">Industry:</span>
                <span className="pf-meta-val">{(lead as any).industry || "—"}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Region:</span>
                <span className="pf-meta-val">{printRegionLabel}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Assigned To:</span>
                <span className="pf-meta-val">{lead.assignedTo || "Unassigned"}</span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Lead Created:</span>
                <span className="pf-meta-val">
                  {lead.leadCreatedAt
                    ? new Date(lead.leadCreatedAt).toLocaleString()
                    : new Date(lead.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="pf-meta-row">
                <span className="pf-meta-key">Created Date:</span>
                <span className="pf-meta-val">{new Date(lead.createdAt).toLocaleDateString()}</span>
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

          {/* ATTACHMENTS — reference table (non-image) */}
          {otherAttachments.length > 0 && (
            <div className="pf-section">
              <div className="pf-section-header">Attached Documents ({otherAttachments.length})</div>
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th style={{ width: "15%" }}>Type</th>
                    <th style={{ width: "15%" }}>Size</th>
                    <th style={{ width: "15%" }}>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {otherAttachments.map((f, i) => (
                    <tr key={i}>
                      <td>{f.fileName || "—"}</td>
                      <td>{shortType(f.fileType || "")}</td>
                      <td>{formatBytes(f.fileSize) || "—"}</td>
                      <td style={{ fontSize: 9, wordBreak: "break-all" }}>
                        {f.publicId ? f.publicId.slice(-8) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ATTACHMENTS — embedded images */}
          {imageAttachments.map((f, i) => (
            <div key={i} className="pf-section">
              <div className="pf-section-header">Image {i + 1}: {f.fileName}</div>
              <div className="pf-attach-image-box">
                <img
                  src={f.url}
                  alt={f.fileName}
                  className="pf-attach-image"
                  crossOrigin="anonymous"
                />
              </div>
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
  const sections: { title: string; rows: { label: string; value: string }[] }[] = [];

  const clientRows: { label: string; value: string }[] = [];
  const addClient = (label: string, value: unknown) => {
    const formatted = formatFieldValue(value);
    if (formatted !== "") clientRows.push({ label, value: formatted });
  };

  addClient("Full Name", lead.fullName);
  addClient("Client Type", lead.clientType);
  addClient("Email Address", lead.email);
  addClient("Phone Number", lead.phone);
  addClient("Company / Organization", lead.companyName);

  // ✅ NEW — Industry in the printed client section
  addClient("Industry", (lead as any).industry);

  addClient("Designation / Role", lead.designation);
  addClient("Consultant Name", lead.consultantName);
  addClient("Preferred Contact Method", lead.preferredContactMethod);
  addClient("Preferred Contact Time", lead.preferredContactTime);

  // ✅ NEW — include country / location / region in the printed client section
  addClient("Country", (lead as any).country);
  addClient("Location", (lead as any).location);
  addClient(
    "Client Region",
    (lead as any).clientRegion ||
      ((lead as any).country && (lead as any).country !== "Pakistan"
        ? "International"
        : "Local")
  );

  // ✅ Format social links cleanly for the printout
  if (lead.socialLinks && lead.socialLinks.length > 0) {
    const socialsStr = lead.socialLinks
      .map((l: any) => `${l.name || "Link"}: ${l.url || "—"}`)
      .join("\n");
    addClient("Social Links", socialsStr);
  }

  if (clientRows.length) sections.push({ title: "1. Client & Contact Information", rows: clientRows });

  const submittedRows = getVisibleLeadFields(lead)
    .map(([key, value]) => ({ label: formatFieldLabel(key), value: formatFieldValue(value) }))
    .filter((row) => row.value !== "");

  if (submittedRows.length) {
    sections.push({ title: "2. All Submitted Information", rows: submittedRows });
  }

  const operationalRows: { label: string; value: string }[] = [];
  const addOperational = (label: string, value: unknown) => {
    const formatted = formatFieldValue(value);
    if (formatted !== "") operationalRows.push({ label, value: formatted });
  };
  addOperational("Lead Status", lead.status);
  addOperational("Assigned To", lead.assignedTo);
  addOperational("Lead Source", (lead as any).source);
  addOperational("Created By", (lead as any).createdBy);
  addOperational("Lead Created", lead.leadCreatedAt || lead.createdAt);
  if (operationalRows.length) sections.push({ title: "3. Lead Management Information", rows: operationalRows });

  return sections;
}

const HIDDEN_LEAD_FIELDS = new Set([
  "_id", "__v", "createdAt", "updatedAt",
  "fullName", "email", "phone", "clientType", "companyName", "designation",
  "consultantName", "preferredContactMethod", "preferredContactTime",
  "status", "assignedTo", "notes", "messages", "auditLogs", "attachments",
  "submissionLocation", "createdBy", "createdById", "consultantId",
  "leadCreatedAt", "source",
  // ✅ Hide region flags and socials — they have dedicated cells
  "country", "location", "isInternationalClient", "clientRegion", "socialLinks",
  // ✅ Industry is surfaced in the "General Information" card + printed client section
  "industry",
]);

function getVisibleLeadFields(lead: InquiryDoc): [string, unknown][] {
  return Object.entries(lead as any).filter(([key, value]) => {
    if (HIDDEN_LEAD_FIELDS.has(key)) return false;
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}

function formatFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    targetAudience: "Target Audience",
    targetAudienceFull: "Target Audience (Full)",
    businessKeywords50: "Business Keywords",
    gscDetails: "Google Search Console Details",
    dynamicUrlRecs: "Dynamic URL Recommendations",
    serpPositioning: "SERP Positioning",
    usp: "Unique Selling Proposition (USP)",
    relevantLink: "Relevant Links",
  };
  if (labels[key]) return labels[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => formatFieldValue(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .map(([key, item]) => `${formatFieldLabel(key)}: ${formatFieldValue(item)}`)
      .join("\n");
  }
  return String(value).trim();
}

function isLongField(key: string, value: unknown): boolean {
  const text = formatFieldValue(value);
  return text.length > 90 || /description|notes|audience|goals|features|reference|credential|activities|keywords|suggestion|message|detail|timeline|follow.?up/i.test(key);
}

/* ── UI primitives ── */
function Cell({ label, value, bold, block }: { label: string; value?: string; bold?: boolean; block?: boolean }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={block ? "col-span-full" : ""}>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-stone-800 ${bold ? "font-semibold" : "font-medium"} text-[13px] ${block ? "whitespace-pre-wrap leading-relaxed bg-stone-50 p-3 rounded-md border border-stone-100" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/* ── Social Icons ── */
function SocialIcon({ name }: { name?: string }) {
  const n = (name || "").toLowerCase();
  if (n.includes("facebook")) return <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>;
  if (n.includes("instagram")) return <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path></svg>;
  if (n.includes("linkedin")) return <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;
  if (n.includes("twitter") || n === "x") return <svg className="w-4 h-4 text-stone-800" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (n.includes("youtube")) return <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (n.includes("tiktok")) return <svg className="w-4 h-4 text-stone-900" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
  if (n.includes("whatsapp")) return <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>;
  if (n.includes("telegram")) return <svg className="w-4 h-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  // Default icon (Globe)
  return <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>;
}