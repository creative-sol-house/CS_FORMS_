import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import { resolveLocation } from "@/lib/location";
import User from "@/lib/User";
import { sendMail, leadCreatedByDeveloperEmail } from "@/lib/mailer";
import { broadcastLeadUpdate } from "@/app/api/admin/inquiries/stream/route";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const submissionLocation = await resolveLocation(req);

    // ── Normalize "Lead Created" timestamp (user-supplied, default: now)
    let leadCreatedAt: Date;
    if (body.leadCreatedAt) {
      const parsed = new Date(body.leadCreatedAt);
      leadCreatedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      leadCreatedAt = new Date();
    }

    const isBackdated =
      Math.abs(leadCreatedAt.getTime() - Date.now()) > 60_000;

    // ── Server-enforced provenance — ignore whatever the client sent
    const payload = {
      ...body,

      // ✅ Provenance — cannot be spoofed
      consultantName: "Website Form",
      consultantId: "",
      createdBy: "Website Form",
      createdById: "public-form",
      source: "form" as const,

      // ✅ Server defaults
      status: "Pending" as const,
      assignedTo: "",
      notes: "",
      messages: [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      submissionLocation,
      leadCreatedAt,

      auditLogs: [
        {
          action: "Created",
          details:
            "Lead submitted via public website form" +
            (isBackdated
              ? ` · backdated to ${leadCreatedAt.toLocaleString()}`
              : ""),
          performedBy: "Website Form",
          timestamp: new Date(),
        },
        ...(Array.isArray(body.attachments) && body.attachments.length > 0
          ? [
              {
                action: "Attachments",
                details: `${body.attachments.length} file(s) attached on submission`,
                performedBy: "Website Form",
                timestamp: new Date(),
              },
            ]
          : []),
      ],
    };

    // ── Strip any malicious/irrelevant fields the client may have injected
    delete (payload as any).newMessage;
    delete (payload as any).markRead;
    delete (payload as any)._id;
    delete (payload as any).auditLogs_override;

    const doc = await Inquiry.create(payload);

    // ── Notify every admin (non-blocking)
    try {
      const admins = await User.find({ role: "admin" }).lean();
      for (const admin of admins) {
        if (!admin.email) continue;
        const tpl = leadCreatedByDeveloperEmail(
          admin.name,
          "Website Form",
          doc
        );
        await sendMail({
          to: admin.email,
          subject: tpl.subject,
          html: tpl.html,
        });
      }
    } catch (mailErr) {
      console.error("Admin notify email failed:", mailErr);
    }

    // ── Broadcast to live dashboards
    try {
      broadcastLeadUpdate(doc.toObject ? doc.toObject() : doc);
    } catch {}

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err: any) {
    console.error("❌ Inquiry API error:", err.name, err.message);
    return NextResponse.json(
      { success: false, error: err.message, name: err.name },
      { status: 500 }
    );
  }
}