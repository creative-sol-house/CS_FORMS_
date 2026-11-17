import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import User from "@/lib/User";
import { verifySession } from "@/lib/auth";
import { sendMail, leadAssignedEmail } from "@/lib/mailer";
import { broadcastLeadUpdate } from "./stream/route";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─────────────────────────────────────────────────────────────
// GET — list leads (admin) / list assigned leads (developer)
//       Supports ?focus=<id> to return a single lead (fast poll)
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();

    const url = new URL(req.url);
    const focus = url.searchParams.get("focus");

    // Single-lead fetch (used by fast chat polling)
    if (focus) {
      const one = await Inquiry.findById(focus).lean();
      if (!one)
        return NextResponse.json({ success: true, inquiries: [] });

      // Permission check for non-admins
      if (session.role !== "admin" && one.assignedTo !== session.username) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, inquiries: [one] });
    }

    // Full list
    const query =
      session.role === "admin" ? {} : { assignedTo: session.username };

    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, inquiries });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — update lead fields, notes, assignment, chat messages,
//         read receipts, and broadcast changes via SSE
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const { id, updates } = await req.json();

    if (!id)
      return NextResponse.json(
        { success: false, error: "Lead id required" },
        { status: 400 }
      );

    const inquiry = await Inquiry.findById(id);
    if (!inquiry)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );

    // Non-admins may only touch their own assigned leads
    if (session.role !== "admin" && inquiry.assignedTo !== session.username) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const logDetails: string[] = [];
    const notesChanged =
      updates.notes !== undefined && updates.notes !== inquiry.notes;

    // Extract custom payloads BEFORE assigning to $set
    const newMessage: string | undefined = updates.newMessage;
    const markRead: boolean = !!updates.markRead;
    delete updates.newMessage;
    delete updates.markRead;

    if (updates.status && updates.status !== inquiry.status)
      logDetails.push(`Status: ${inquiry.status} → ${updates.status}`);
    if (
      updates.assignedTo !== undefined &&
      updates.assignedTo !== inquiry.assignedTo
    )
      logDetails.push(`Assigned to: ${updates.assignedTo || "Unassigned"}`);

    const updateQuery: any = { $set: { ...updates } };

    // ── Append new chat message
    if (newMessage && newMessage.trim().length > 0) {
      const text = newMessage.trim().slice(0, 4000);
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.messages = {
        text,
        sender: session.username,
        senderRole: session.role,
        timestamp: new Date(),
        readBy: [session.username],
      };
    }

    // ── Append audit log entries
    const auditEntries: any[] = [];
    if (logDetails.length > 0) {
      auditEntries.push({
        action: "Update",
        details: logDetails.join(", "),
        performedBy: session.username,
        timestamp: new Date(),
      });
    }
    if (notesChanged) {
      auditEntries.push({
        action: "Note",
        details: updates.notes?.trim() || "(cleared)",
        performedBy: session.username,
        timestamp: new Date(),
      });
    }
    if (auditEntries.length > 0) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.auditLogs = { $each: auditEntries };
    }

    // ── Read receipts: mark every message not sent by me as read
    if (markRead) {
      inquiry.messages.forEach((msg: any, idx: number) => {
        if (
          msg.sender !== session.username &&
          !msg.readBy?.includes(session.username)
        ) {
          updateQuery.$set[`messages.${idx}.readBy`] = [
            ...(msg.readBy || []),
            session.username,
          ];
        }
      });
    }

    const updated = await Inquiry.findByIdAndUpdate(id, updateQuery, {
      new: true,
    }).lean();

    if (!updated)
      return NextResponse.json(
        { success: false, error: "Update failed" },
        { status: 500 }
      );

    // ── Send assignment email (non-blocking)
    if (
      updates.assignedTo !== undefined &&
      updates.assignedTo !== inquiry.assignedTo &&
      updates.assignedTo
    ) {
      try {
        const assignedUser = await User.findOne({
          username: updates.assignedTo,
        }).lean();
        if (assignedUser?.email) {
          const tpl = leadAssignedEmail(assignedUser.username, updated as any);
          await sendMail({
            to: assignedUser.email,
            subject: tpl.subject,
            html: tpl.html,
          });
        }
      } catch (mailErr) {
        console.error("Assign email failed:", mailErr);
      }
    }

    // ── Broadcast to all connected clients (SSE)
    try {
      broadcastLeadUpdate(updated);
    } catch (e) {
      console.error("SSE broadcast failed:", e);
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (err: any) {
    console.error("PATCH /api/admin/inquiries error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — remove a lead (admin only) + broadcast deletion
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    if (session.role !== "admin")
      return NextResponse.json(
        { success: false, error: "Admin only" },
        { status: 403 }
      );

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { success: false, error: "Lead id required" },
        { status: 400 }
      );

    await connectDB();
    const deleted = await Inquiry.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );

    // Broadcast deletion so connected clients drop the row immediately
    try {
      broadcastLeadUpdate({ _id: id, __deleted: true });
    } catch (e) {
      console.error("SSE broadcast (delete) failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/inquiries error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}