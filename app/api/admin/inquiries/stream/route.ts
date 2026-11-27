import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";

// ── Subscriber registry ─────────────────────────────────────
// Each listener now remembers WHO is subscribed, so we can filter
// broadcasts per-recipient. Without this, any lead:update leaks to
// every connected tab.
type Subscriber = {
  listener: (data: string) => void;
  userId: string;
  name: string;
  role: string;
};

const subscribers = new Set<Subscriber>();

// ── Visibility rule (mirror of GET + snapshot query) ────────
function canSee(
  sub: Subscriber,
  lead: any
): boolean {
  if (sub.role === "admin") return true;
  if (!lead) return false;
  // Creator?
  if (lead.createdById && lead.createdById === sub.userId) return true;
  if (lead.createdBy && lead.createdBy === sub.name) return true;
  // Assignee?
  if (lead.assignedTo && lead.assignedTo === sub.name) return true;
  return false;
}

export function broadcastLeadUpdate(lead: any) {
  const payload = JSON.stringify({ type: "lead:update", lead });
  for (const sub of subscribers) {
    try {
      if (canSee(sub, lead)) {
        sub.listener(payload);
      } else {
        // If the recipient was previously allowed to see this lead but
        // now isn't (reassigned, unassigned, deleted), tell them to drop it.
        // The client treats "__drop" as "remove this row".
        sub.listener(
          JSON.stringify({ type: "lead:update", lead: { _id: lead._id, __drop: true } })
        );
      }
    } catch {}
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const session = verifySession(token);
  if (!session) return new Response("Unauthorized", { status: 401 });

  await connectDB();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {}
      }, 25000);

      const subscriber: Subscriber = {
        userId: session.userId,
        name: session.name,
        role: session.role,
        listener: (payload) => {
          try {
            controller.enqueue(enc.encode(`data: ${payload}\n\n`));
          } catch {}
        },
      };

      subscribers.add(subscriber);

      // ✅ Initial snapshot: created-by-me OR assigned-to-me (non-admin)
      try {
        const query =
          session.role === "admin"
            ? {}
            : {
                $or: [
                  { assignedTo: session.name },
                  { createdById: session.userId },
                  { createdBy: session.name },
                ],
              };
        const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).lean();
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ type: "snapshot", inquiries })}\n\n`
          )
        );
      } catch {}

      const cleanup = () => {
        clearInterval(heartbeat);
        subscribers.delete(subscriber);
        try {
          controller.close();
        } catch {}
      };

      (controller as any)._cleanup = cleanup;
    },
    cancel() {
      // Next.js calls this on client disconnect; the listener is
      // removed via the subscriber set on the next broadcast attempt.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
} 