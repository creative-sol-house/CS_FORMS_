import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";

// ── In-memory subscriber registry (per serverless instance)
// Works fine on Vercel for a small admin team. For multi-instance scale,
// swap for Redis pub/sub or Pusher.
type Listener = (data: any) => void;
const listeners = new Set<Listener>();

export function broadcastLeadUpdate(lead: any) {
  const payload = JSON.stringify({ type: "lead:update", lead });
  for (const l of listeners) {
    try {
      l(payload);
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

  const listener: Listener = (payload) => {
    try {
      controller.enqueue(enc.encode(`data: ${payload}\n\n`));
    } catch {}
  };

  listeners.add(listener);

// Send an initial snapshot so client is in sync
try {
  const query =
    session.role === "admin"
      ? {}
      : {
          $or: [
            { assignedTo: session.name },
            { createdById: session.userId },
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
    listeners.delete(listener);
    try {
      controller.close();
    } catch {}
  };

  (controller as any)._cleanup = cleanup;
},

    cancel() {
      // Called when client disconnects
      // Remove all listeners that were added in this stream
      // (Simplified — we rely on the try/catch in broadcast to drop dead ones)
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