"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { InquiryDoc, ChatMessage } from "@/lib/types";

export default function ChatModal({
  lead,
  currentUser,
  currentUserRole,
  onClose,
  onSendMessage,
}: {
  lead: InquiryDoc;
  currentUser: string;
  currentUserRole: "admin" | "business_developer";
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
}) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Merge server + optimistic
  const messages = useMemo(() => {
    const server = lead.messages || [];
    if (optimistic.length === 0) return server;
    const serverKeySet = new Set(server.map((m) => `${m.sender}|${m.text}`));
    const stillPending = optimistic.filter(
      (m) => !serverKeySet.has(`${m.sender}|${m.text}`)
    );
    return [...server, ...stillPending];
  }, [lead.messages, optimistic]);

  // Group by calendar day
  const grouped = useMemo(() => {
    const groups: { day: string; messages: ChatMessage[] }[] = [];
    let lastDay = "";
    for (const m of messages) {
      const d = new Date(m.timestamp);
      const day = d.toDateString();
      if (day !== lastDay) {
        groups.push({
          day: d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          }),
          messages: [],
        });
        lastDay = day;
      }
      groups[groups.length - 1].messages.push(m);
    }
    return groups;
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || sending) return;

    const temp: ChatMessage = {
      text,
      sender: currentUser,
      senderRole: currentUserRole,
      timestamp: new Date().toISOString(),
      readBy: [currentUser],
    };

    setOptimistic((p) => [...p, temp]);
    setMessageText("");
    setSending(true);
    try {
      await onSendMessage(text);
      setOptimistic((p) => p.filter((m) => m !== temp));
    } catch {
      setMessageText(text);
      setOptimistic((p) => p.filter((m) => m !== temp));
    } finally {
      setSending(false);
    }
  };

  // Helper component for the ticks
  const MessageStatus = ({ isPending, isRead }: { isPending: boolean; isRead: boolean }) => {
    if (isPending) {
      // Pending: Single Gray Tick
      return (
        <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.91 3.316L4.477 9.75L1.57 6.844L0.5 7.914L4.477 11.891L11.98 4.386L10.91 3.316Z" fill="currentColor"/>
        </svg>
      );
    }
    if (isRead) {
      // Read: Double Blue Tick
      return (
        <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor"/>
        </svg>
      );
    }
    // Sent but not read: Double Gray Tick
    return (
      <svg className="w-4 h-4 text-stone-400" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor"/>
      </svg>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl h-full sm:h-[88vh] sm:rounded-lg flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#075E54] px-4 py-3 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
{(
  lead.fullName?.trim() ||
  lead.companyName?.trim() ||
  "?"
).charAt(0).toUpperCase()}            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">
  {lead.fullName?.trim() || lead.companyName?.trim() || "Unnamed Client"}
</h2>
              <p className="text-[11px] text-white/75 truncate">{lead.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-[#ECE5DD]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-500">
              <svg className="w-14 h-14 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation below.</p>
            </div>
          ) : (
            grouped.map((group, gi) => (
              <div key={gi}>
                <div className="flex justify-center my-3">
                  <span className="bg-white/80 text-[11px] text-stone-600 font-medium px-3 py-1 rounded-full shadow-sm">
                    {group.day}
                  </span>
                </div>
                {group.messages.map((msg, idx) => {
                  const isMine = msg.sender === currentUser;
                  const isPending = optimistic.includes(msg);
                  
                  // Determine if the message was read by ANYONE other than the sender
                  const isRead = msg.readBy?.some((u) => u !== msg.sender) || false;

                  return (
                    <div
                      key={msg._id || `${gi}-${idx}`}
                      className={`flex mb-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-lg shadow-sm relative ${
                          isMine
                            ? "bg-[#DCF8C6] text-stone-900 rounded-br-sm"
                            : "bg-white text-stone-900 rounded-bl-sm"
                        } ${isPending ? "opacity-70" : ""}`}
                      >
                        {!isMine && (
                          <div className="text-[11px] font-semibold text-[#075E54] mb-0.5">
                            {msg.sender}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        
                        {/* Timestamp and Ticks */}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-stone-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMine && (
                            <span className="ml-1 flex items-center">
                              <MessageStatus isPending={isPending} isRead={isRead} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="bg-[#F0F0F0] p-2 sm:p-3 border-t border-stone-300 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 resize-none p-2.5 border border-stone-300 rounded-lg text-sm focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] outline-none max-h-32 overflow-y-auto bg-white"
              placeholder="Type a message…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="p-2.5 bg-[#075E54] hover:bg-[#064E46] text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
              aria-label="Send message"
            >
              {sending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}