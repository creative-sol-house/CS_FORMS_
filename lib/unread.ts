import { InquiryDoc } from "@/lib/types";

/**
 * Number of unread messages in this lead for the given user.
 * A message is "unread" if:
 *   - it wasn't sent by `currentUser`
 *   - `readBy` doesn't include `currentUser`
 */
export function unreadCountFor(lead: InquiryDoc, currentUser: string): number {
  const messages = lead.messages || [];
  return messages.reduce((acc, m) => {
    if (m.sender === currentUser) return acc;
    if (Array.isArray(m.readBy) && m.readBy.includes(currentUser)) return acc;
    return acc + 1;
  }, 0);
}

/** True if any message from someone else is unread by `currentUser`. */
export function hasUnreadFor(lead: InquiryDoc, currentUser: string): boolean {
  return unreadCountFor(lead, currentUser) > 0;
}