import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import User from "@/lib/User";
import { verifySession } from "@/lib/auth";
import {
  sendMail,
  leadAssignedEmail,
  leadCreatedByDeveloperEmail,
} from "@/lib/mailer";
import { broadcastLeadUpdate } from "./stream/route";
import cloudinary from "cloudinary";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─────────────────────────────────────────────────────────────
// GET — list leads (admin) / list assigned-or-created leads (developer)
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

      // Permission check for non-admins: must own it OR be assigned to it
      if (session.role !== "admin") {
        const ownsIt = (one as any).createdById === session.userId;
        const assigned = one.assignedTo === session.name;
        if (!ownsIt && !assigned) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({ success: true, inquiries: [one] });
    }

    // Full list — non-admins see leads they created OR are assigned to
    const query =
      session.role === "admin"
        ? {}
        : {
            $or: [
              { assignedTo: session.name },
              { createdById: session.userId },
            ],
          };

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
// POST — create a lead (admin or business_developer)
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectDB();
    const body = await req.json();

    // Server-enforced creator identity — never trust client
    const payload = {
      ...body,
      consultantName: session.name,
      consultantId: session.userId,
      createdBy: session.name,
      createdById: session.userId,
      status: "Pending",
      notes: "",
      messages: [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      auditLogs: [
        {
          action: "Created",
          details: `Lead created by ${session.name} (${session.role})`,
          performedBy: session.name,
          timestamp: new Date(),
        },
        ...(Array.isArray(body.attachments) && body.attachments.length > 0
          ? [
              {
                action: "Attachments",
                details: `${body.attachments.length} file(s) attached on creation`,
                performedBy: session.name,
                timestamp: new Date(),
              },
            ]
          : []),
      ],
      assignedTo:
        session.role === "business_developer"
          ? session.name
          : body.assignedTo || "",
    };
    delete (payload as any).newMessage;
    delete (payload as any).markRead;

    const lead = await Inquiry.create(payload);

    // ── Email every admin
    try {
      const admins = await User.find({ role: "admin" }).lean();
      for (const admin of admins) {
        if (!admin.email) continue;
        const tpl = leadCreatedByDeveloperEmail(
          admin.name,
          session.name,
          lead
        );
        await sendMail({ to: admin.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (mailErr) {
      console.error("Admin notify email failed:", mailErr);
    }

    // ── Broadcast so other open dashboards update live
    try {
      broadcastLeadUpdate(lead.toObject ? lead.toObject() : lead);
    } catch {}

    return NextResponse.json({ success: true, inquiry: lead });
  } catch (err: any) {
    console.error("POST /api/admin/inquiries error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — update lead fields, notes, assignment, chat messages,
//         read receipts, attachments, and broadcast changes via SSE
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

    // ── PERMISSIONS ──────────────────────────────────────────────────────────
    if (session.role !== "admin") {
      const isEditingFormData = Object.keys(updates).some(
        (key) =>
          !["status", "notes", "assignedTo", "newMessage", "markRead"].includes(
            key
          )
      );

      const createdById = (inquiry as any).createdById as string | undefined;
      const ownsIt = createdById === session.userId;
      const assigned = inquiry.assignedTo === session.name;

      if (isEditingFormData && !ownsIt) {
        return NextResponse.json(
          { success: false, error: "You can only edit leads you created." },
          { status: 403 }
        );
      }

      if (!ownsIt && !assigned) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const logDetails: string[] = [];
    const notesChanged =
      updates.notes !== undefined && updates.notes !== inquiry.notes;

    // Extract custom payloads BEFORE assigning to $set
    const newMessage: string | undefined = updates.newMessage;
    const markRead: boolean = !!updates.markRead;
    delete updates.newMessage;
    delete updates.markRead;

    // ── FIX: Delete immutable/system fields to prevent MongoDB conflicts ──
    delete updates._id;
    delete updates.auditLogs;
    delete updates.messages;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

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
        sender: session.name,
        senderRole: session.role,
        timestamp: new Date(),
        readBy: [session.name],
      };
    }

    // ── Append audit log entries
    const auditEntries: any[] = [];
    if (logDetails.length > 0) {
      auditEntries.push({
        action: "Update",
        details: logDetails.join(", "),
        performedBy: session.name,
        timestamp: new Date(),
      });
    }
    if (notesChanged) {
      auditEntries.push({
        action: "Note",
        details: updates.notes?.trim() || "(cleared)",
        performedBy: session.name,
        timestamp: new Date(),
      });
    }

    // ── ATTACHMENTS AUDIT + CLEANUP ─────────────────────────────────────
    if (updates.attachments !== undefined && Array.isArray(updates.attachments)) {
      const newIds = new Set<string>(
        updates.attachments
          .map((a: any) => a?.publicId)
          .filter((v: any): v is string => typeof v === "string" && !!v)
      );

      const removedIds: string[] = Array.isArray(inquiry.attachments)
        ? (inquiry.attachments as any[])
            .map((a) => a?.publicId)
            .filter(
              (v: any): v is string =>
                typeof v === "string" && !!v && !newIds.has(v)
            )
        : [];

      auditEntries.push({
        action: "Attachments",
        details: `${updates.attachments.length} file(s) attached${
          removedIds.length > 0 ? ` · ${removedIds.length} removed` : ""
        }`,
        performedBy: session.name,
        timestamp: new Date(),
      });

      if (removedIds.length > 0) {
        cloudinary.v2.config({
          cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        Promise.allSettled(
          removedIds.map((pid) =>
            cloudinary.v2.uploader.destroy(pid, { resource_type: "raw" })
          )
        ).catch((e) => console.error("Cloudinary cleanup failed:", e));
      }
    }

    if (auditEntries.length > 0) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.auditLogs = { $each: auditEntries };
    }

    // ── Read receipts: mark every message not sent by me as read
    if (markRead) {
      inquiry.messages.forEach((msg: any, idx: number) => {
        if (msg.sender !== session.name && !msg.readBy?.includes(session.name)) {
          updateQuery.$set[`messages.${idx}.readBy`] = [
            ...(msg.readBy || []),
            session.name,
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
          const tpl = leadAssignedEmail(assignedUser.name, updated as any);
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

    // Best-effort: purge all attachments from Cloudinary (non-blocking)
    if (Array.isArray((deleted as any).attachments) && (deleted as any).attachments.length > 0) {
      cloudinary.v2.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      Promise.allSettled(
        (deleted as any).attachments
          .map((a: any) => a?.publicId)
          .filter((v: any): v is string => typeof v === "string" && !!v)
          .map((pid: string) =>
            cloudinary.v2.uploader.destroy(pid, { resource_type: "raw" })
          )
      ).catch((e) => console.error("Cloudinary delete cleanup failed:", e));
    }

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