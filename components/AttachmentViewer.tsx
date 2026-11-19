"use client";
import { LeadAttachment } from "@/lib/types";

export default function AttachmentViewer({
  attachment,
  onClose,
}: {
  attachment: LeadAttachment;
  onClose: () => void;
}) {
  const isPdf = attachment.fileType.includes("pdf");
  const isImage = attachment.fileType.startsWith("image/");

  const handlePrint = () => {
    const w = window.open(attachment.url, "_blank");
    if (w) {
      w.onload = () => setTimeout(() => w.print(), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-stone-200 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{attachment.fileName}</p>
            <p className="text-[11px] text-stone-500 truncate">Uploaded by {attachment.uploadedBy}</p>
          </div>
          <a
            href={attachment.url}
            download={attachment.fileName}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-lg"
          >
            Download
          </a>
          {isPdf && (
            <button onClick={handlePrint} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 bg-stone-50 overflow-hidden">
          {isPdf || isImage ? (
            <iframe
              src={isImage ? attachment.url : `${attachment.url}#toolbar=1`}
              className="w-full h-[75vh] border-0"
              title={attachment.fileName}
            />
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-2xl font-bold text-stone-400">
                {attachment.fileType.includes("word") ? "W" : "X"}
              </div>
              <p className="text-sm text-stone-700 font-medium">Inline preview isn't supported for this file type.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <a href={attachment.url} download={attachment.fileName} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Download</a>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg">Open in new tab</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}