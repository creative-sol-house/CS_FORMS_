import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try { return verifySession(token); } catch { return null; }
}

function parseDate(s: string | null, end = false): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  if (end) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const url = new URL(req.url);
  const from = parseDate(url.searchParams.get("from"), false);
  const to = parseDate(url.searchParams.get("to"), true);

  const leadQuery: any =
    session.role === "admin"
      ? {}
      : { $or: [{ assignedTo: session.name }, { createdById: session.userId }] };

  // ✅ Fetch all fields including attachments
  const allLeads = await Inquiry.find(leadQuery).sort({ createdAt: -1 }).lean();

  const inRange = (d?: Date | string | null) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    if (from && t < from.getTime()) return false;
    if (to && t > to.getTime()) return false;
    return true;
  };

  const actionCounts: Record<string, number> = {};

  const scopedLeads = allLeads
    .map((lead: any) => {
      const rawLogs: any[] = Array.isArray(lead.auditLogs) ? lead.auditLogs : [];
      const filteredLogs = from || to ? rawLogs.filter((l) => inRange(l.timestamp)) : rawLogs;

      filteredLogs.forEach((l) => {
        const a = l.action || "Other";
        actionCounts[a] = (actionCounts[a] || 0) + 1;
      });

      return {
        ...lead,
        auditLogs: filteredLogs,
        _matchesRange:
          !from && !to ? true : inRange(lead.createdAt) || filteredLogs.length > 0,
      };
    })
    .filter((l: any) => l._matchesRange)
    .map(({ _matchesRange, ...rest }: any) => rest);

  const totalLeads = scopedLeads.length;
  const approved = scopedLeads.filter((l: any) => l.status === "Approved").length;
  const conversionRate = totalLeads > 0 ? Math.round((approved / totalLeads) * 100) : 0;

  const byServiceMap: Record<string, number> = {};
  scopedLeads.forEach((l: any) => {
    const key = l.serviceCategory || "Unspecified";
    byServiceMap[key] = (byServiceMap[key] || 0) + 1;
  });
  const leadsByService = Object.entries(byServiceMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  let calls = 0;
  let meetings = 0;
  const recentActivity: any[] = [];

  scopedLeads.forEach((lead: any) => {
    (lead.auditLogs || []).forEach((log: any) => {
      const action = (log.action || "").toLowerCase();
      const details = (log.details || "").toLowerCase();
      const isCall = action === "call" || details.startsWith("call");
      const isMeeting = action === "meeting" || details.startsWith("meeting");
      if (isCall) calls++;
      if (isMeeting) meetings++;
      if (isCall || isMeeting) {
        recentActivity.push({
          type: isCall ? "Call" : "Meeting",
          note: log.details,
          date: log.timestamp,
          loggedBy: log.performedBy,
          // ✅ Use companyName if it exists
          leadName: lead.companyName || lead.fullName,
          leadId: lead._id,
        });
      }
    });
  });

  recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    success: true,
    data: {
      totalLeads,
      approved,
      conversionRate,
      calls,
      meetings,
      leadsByService,
      recentActivity: recentActivity.slice(0, 20),
      actionCounts,
      leads: scopedLeads,
      range: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
      },
    },
  });
}