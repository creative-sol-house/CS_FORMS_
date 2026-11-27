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
import { buildFieldDiffs, diffAttachments } from "@/lib/auditDiff";
import { getIndustrySuggestions, findIndustryConflict } from "@/lib/industry";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─────────────────────────────────────────────────────────────
// GET — list leads (admin) / list assigned-or-created leads (developer)
//       Supports ?focus=<id> to return a single lead (fast poll)
//       Supports ?industries=<q> for industry autocomplete
//       Supports ?industry=<name> to filter leads by industry
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const url = new URL(req.url);

    // ✅ NEW — industry autocomplete: GET /api/admin/inquiries?industries=pow
    if (url.searchParams.has("industries")) {
      const q = url.searchParams.get("industries") || "";
      const suggestions = await getIndustrySuggestions(q, 15);
      return NextResponse.json({ success: true, suggestions });
    }

    await connectDB();

    const focus = url.searchParams.get("focus");

    if (focus) {
      const one = await Inquiry.findById(focus).lean();
      if (!one)
        return NextResponse.json({ success: true, inquiries: [] });

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

    // ✅ already correct: created OR assigned
    const baseQuery =
      session.role === "admin"
        ? {}
        : {
            $or: [
              { assignedTo: session.name },
              { createdById: session.userId },
            ],
          };

    // ✅ NEW — optional industry filter
    const industry = url.searchParams.get("industry")?.trim();
    const query =
      industry && industry !== "all"
        ? { ...baseQuery, $and: [{ industry: industry }] }
        : baseQuery;

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

    // Email is optional; validate only when provided
    body.email = body.email?.trim() || "";

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // ✅ NEW — industry accuracy guard (warn on similar existing names)
    if (body.industry && !body.forceIndustry) {
      const { similar } = await findIndustryConflict(body.industry, {
        allowExact: true,
      });
      if (similar.length > 0) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            error: `Similar industries already exist: ${similar
              .slice(0, 3)
              .join(", ")}. Add anyway?`,
            similar,
          },
          { status: 409 }
        );
      }
    }

    // ── Normalize the user-supplied "Lead Created" timestamp ────────────────
    let leadCreatedAt: Date;
    if (body.leadCreatedAt) {
      const parsed = new Date(body.leadCreatedAt);
      leadCreatedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      leadCreatedAt = new Date();
    }

    const isBackdated =
      Math.abs(leadCreatedAt.getTime() - Date.now()) > 60_000;

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
      leadCreatedAt,

      // ✅ NEW — canonical industry (trimmed)
      industry: (body.industry || "").trim(),

      auditLogs: [
        {
          action: "Created",
          details:
            `Lead created by ${session.name} (${session.role})` +
            (body.industry ? ` · industry "${body.industry.trim()}"` : "") +
            (isBackdated
              ? ` · backdated to ${leadCreatedAt.toLocaleString()}`
              : ""),
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

      // ✅ FIX: do NOT force-assign to creator.
      // Creator visibility is handled by createdById in GET/SSE.
      assignedTo: body.assignedTo || "",
    };
    delete (payload as any).newMessage;
    delete (payload as any).markRead;
    delete (payload as any).forceIndustry;

    const lead = await Inquiry.create(payload);

    // ✅ NEW — keep the GlobalIndustry registry in sync (upsert + increment usage)
    try {
      const GlobalIndustry = (await import("@/lib/GlobalIndustry")).default;
      const { normalizeIndustry } = await import("@/lib/industry");
      const rawIndustry = (payload.industry || "").trim();
      if (rawIndustry) {
        await GlobalIndustry.updateOne(
          { normalized: normalizeIndustry(rawIndustry) },
          {
            $inc: { usageCount: 1 },
            $setOnInsert: {
              name: rawIndustry,
              normalized: normalizeIndustry(rawIndustry),
              createdBy: session.name,
              createdById: session.userId,
            },
          },
          { upsert: true }
        );
      }
    } catch (e) {
      console.error("GlobalIndustry sync (POST) failed:", e);
    }

    // ── Email every admin
    try {
      const admins = await User.find({ role: "admin" }).lean();
      for (const admin of admins) {
        if (!admin.email) continue;
        const tpl = leadCreatedByDeveloperEmail(admin.name, session.name, lead);
        await sendMail({ to: admin.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (mailErr) {
      console.error("Admin notify email failed:", mailErr);
    }

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
//         read receipts, attachments, bulk-assign industry,
//         and broadcast changes via SSE
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

    // ─────────────────────────────────────────────────────────
    // ✅ BULK ASSIGN INDUSTRY
    // id === "__bulk_industry__", updates = { ids[], industry, force? }
    // ─────────────────────────────────────────────────────────
    if (id === "__bulk_industry__") {
      const { ids, industry, force } = updates as {
        ids: string[];
        industry: string;
        force?: boolean;
      };

      if (!Array.isArray(ids) || !industry?.trim()) {
        return NextResponse.json(
          { success: false, error: "ids and industry required" },
          { status: 400 }
        );
      }

      // accuracy guard: warn on similar existing industries unless force=true
      if (!force) {
        const { similar } = await findIndustryConflict(industry.trim(), {
          allowExact: true,
        });
        if (similar.length > 0) {
          return NextResponse.json(
            {
              success: false,
              needsConfirmation: true,
              error: `Similar industries already exist: ${similar
                .slice(0, 3)
                .join(", ")}. Add anyway?`,
              similar,
            },
            { status: 409 }
          );
        }
      }

      // permission: non-admin can only touch leads they created or are assigned to
      const leads = await Inquiry.find({ _id: { $in: ids } }).select(
        "_id createdById assignedTo"
      );
      const allowed = leads.filter((l: any) => {
        if (session.role === "admin") return true;
        return (
          l.createdById === session.userId || l.assignedTo === session.name
        );
      });
      const allowedIds = allowed.map((l) => l._id.toString());

      if (allowedIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "No permitted leads" },
          { status: 403 }
        );
      }

      const now = new Date();
      const cleanIndustry = industry.trim();

      await Inquiry.updateMany(
        { _id: { $in: allowedIds } },
        {
          $set: { industry: cleanIndustry },
          $push: {
            auditLogs: {
              action: "Industry",
              details: `Bulk-assigned industry "${cleanIndustry}" to ${allowedIds.length} lead(s)`,
              performedBy: session.name,
              timestamp: now,
            },
          },
        }
      );

      // ✅ NEW — keep the GlobalIndustry registry in sync
      try {
        const GlobalIndustry = (await import("@/lib/GlobalIndustry")).default;
        const { normalizeIndustry } = await import("@/lib/industry");
        await GlobalIndustry.updateOne(
          { normalized: normalizeIndustry(cleanIndustry) },
          {
            $inc: { usageCount: allowedIds.length },
            $setOnInsert: {
              name: cleanIndustry,
              normalized: normalizeIndustry(cleanIndustry),
              createdBy: session.name,
              createdById: session.userId,
            },
          },
          { upsert: true }
        );
      } catch (e) {
        console.error("GlobalIndustry sync (bulk) failed:", e);
      }

      // broadcast each updated lead + return
      for (const leadId of allowedIds) {
        const doc = await Inquiry.findById(leadId).lean();
        if (doc) {
          try {
            broadcastLeadUpdate(doc);
          } catch {}
        }
      }

      return NextResponse.json({
        success: true,
        updated: allowedIds.length,
        skipped: ids.length - allowedIds.length,
      });
    }

    // ─────────────────────────────────────────────────────────
    // SINGLE-LEAD PATCH
    // ─────────────────────────────────────────────────────────
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

    // ✅ NEW — industry accuracy guard (warn on similar existing names)
    if (updates.industry !== undefined && !updates.forceIndustry) {
      const { similar } = await findIndustryConflict(
        (updates.industry || "").trim(),
        { allowExact: true }
      );
      if (similar.length > 0) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            error: `Similar industries exist: ${similar
              .slice(0, 3)
              .join(", ")}. Add anyway?`,
            similar,
          },
          { status: 409 }
        );
      }
    }
    // strip the force flag so it never hits Mongo
    if (updates.forceIndustry !== undefined) {
      delete updates.forceIndustry;
    }

    // ── Extract custom payloads BEFORE diffing / $set ──────────────────────
    const newMessage: string | undefined = updates.newMessage;
    const markRead: boolean = !!updates.markRead;
    delete updates.newMessage;
    delete updates.markRead;

    // ── Delete immutable/system fields to prevent MongoDB conflicts ────────
    delete updates._id;
    delete updates.auditLogs;
    delete updates.messages;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    // ── Normalize leadCreatedAt so Mongo stores a real Date ────────────────
    if (updates.leadCreatedAt !== undefined) {
      const parsed = updates.leadCreatedAt
        ? new Date(updates.leadCreatedAt)
        : null;
      updates.leadCreatedAt =
        parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
    }

    // ── Build human-readable field diffs ───────────────────────────────────
    const fieldDiffs = buildFieldDiffs(inquiry.toObject(), updates);

    // ── Notes handled separately (full text, not truncated) ────────────────
    const notesChanged =
      updates.notes !== undefined &&
      (updates.notes || "").trim() !== (inquiry.notes || "").trim();
    const nextNotes = updates.notes;
    delete updates.notes; // don't let generic diff handle it

    // ── Attachments: only log if files actually changed ────────────────────
    let attachmentMsg: string | null = null;
    const attachmentRemovals: string[] = [];

    if (
      updates.attachments !== undefined &&
      Array.isArray(updates.attachments)
    ) {
      attachmentMsg = diffAttachments(
        (inquiry.attachments as any[]) || [],
        updates.attachments
      );

      if (attachmentMsg === null) {
        // ✅ No real change → drop attachments from $set entirely
        delete updates.attachments;
      } else {
        // ✅ Real change → compute which files to purge from Cloudinary
        const newIds = new Set(
          updates.attachments
            .map((a: any) => a?.publicId)
            .filter((v: any): v is string => typeof v === "string" && !!v)
        );
        for (const a of (inquiry.attachments as any[]) || []) {
          if (a?.publicId && !newIds.has(a.publicId)) {
            attachmentRemovals.push(a.publicId);
          }
        }
      }
    }

    // ── Build update query ─────────────────────────────────────────────────
    const updateQuery: any = { $set: { ...updates } };

    // Re-apply notes to $set (we deleted it above)
    if (notesChanged) {
      updateQuery.$set.notes = nextNotes;
    }

    // ── Append new chat message ────────────────────────────────────────────
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

    // ── Append audit log entries ───────────────────────────────────────────
    const auditEntries: any[] = [];

    if (fieldDiffs.length > 0) {
      auditEntries.push({
        action: "Update",
        details: fieldDiffs.join(" · "),
        performedBy: session.name,
        timestamp: new Date(),
      });
    }

    if (notesChanged) {
      auditEntries.push({
        action: "Note",
        details: (nextNotes || "").trim().slice(0, 500) || "(cleared)",
        performedBy: session.name,
        timestamp: new Date(),
      });
    }

    if (attachmentMsg) {
      auditEntries.push({
        action: "Attachments",
        details: attachmentMsg,
        performedBy: session.name,
        timestamp: new Date(),
      });
    }

    if (auditEntries.length > 0) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.auditLogs = { $each: auditEntries };
    }

    // ── Cloudinary cleanup for removed files ───────────────────────────────
    if (attachmentRemovals.length > 0) {
      cloudinary.v2.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      Promise.allSettled(
        attachmentRemovals.map((pid) =>
          cloudinary.v2.uploader.destroy(pid, { resource_type: "raw" })
        )
      ).catch((e) => console.error("Cloudinary cleanup failed:", e));
    }

    // ── Read receipts: mark every message not sent by me as read ───────────
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

    // ── Capture old industry BEFORE the update, for registry diff ──────────
    const oldIndustry = (inquiry as any).industry as string | undefined;

    const updated = await Inquiry.findByIdAndUpdate(id, updateQuery, {
      new: true,
    }).lean();

    if (!updated)
      return NextResponse.json(
        { success: false, error: "Update failed" },
        { status: 500 }
      );

    // ✅ NEW — keep the GlobalIndustry registry in sync with single-lead edits
    try {
      const newIndustry = (updated as any).industry as string | undefined;
      if (oldIndustry !== newIndustry) {
        const GlobalIndustry = (await import("@/lib/GlobalIndustry")).default;
        const { normalizeIndustry } = await import("@/lib/industry");

        // decrement old (if it existed and no longer used)
        if (oldIndustry && oldIndustry.trim()) {
          await GlobalIndustry.updateOne(
            { normalized: normalizeIndustry(oldIndustry) },
            { $inc: { usageCount: -1 } }
          );
        }

        // increment / upsert new
        if (newIndustry && newIndustry.trim()) {
          const raw = newIndustry.trim();
          await GlobalIndustry.updateOne(
            { normalized: normalizeIndustry(raw) },
            {
              $inc: { usageCount: 1 },
              $setOnInsert: {
                name: raw,
                normalized: normalizeIndustry(raw),
                createdBy: session.name,
                createdById: session.userId,
              },
            },
            { upsert: true }
          );
        }
      }
    } catch (e) {
      console.error("GlobalIndustry sync (PATCH) failed:", e);
    }

    // ── Send assignment email (non-blocking) ───────────────────────────────
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

    // ── Broadcast to all connected clients (SSE) ───────────────────────────
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
    if (
      Array.isArray((deleted as any).attachments) &&
      (deleted as any).attachments.length > 0
    ) {
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