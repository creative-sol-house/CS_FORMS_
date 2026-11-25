import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  // 1. Check if token exists
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: No token" },
      { status: 401 }
    );
  }

  // 2. Verify token
  const session = verifySession(token);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid token" },
      { status: 401 }
    );
  }

  // 3. Check roles (FIXED: Added "business_developer")
  if (!["admin", "business_developer"].includes(session.role)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Invalid role" },
      { status: 403 }
    );
  }

  // 4. Fetch data
  try {
    await connectDB();

    // session.userId is guaranteed to be a string based on your SessionPayload
    const me = await User.findById(session.userId).select("-password").lean();
    if (!me) {
      return NextResponse.json(
        { success: false, error: "User not found in DB" },
        { status: 404 }
      );
    }

    const uid = (me as any)._id.toString();
    const uname = (me as any).name;

    // Leads I created OR leads assigned to me.
    const [createdLeads, assignedLeads] = await Promise.all([
      Inquiry.find({
        $or: [{ createdById: uid }, { createdBy: uname }],
      })
        .sort({ createdAt: -1 })
        .lean(),

      Inquiry.find({ assignedTo: uname })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Union — dedupe by _id
    const unionMap = new Map<string, any>();
    [...createdLeads, ...assignedLeads].forEach((l: any) => {
      unionMap.set(l._id.toString(), l);
    });
    const allLeads = Array.from(unionMap.values());

    // ── Status counts over the union
    const statusCounts: Record<string, number> = {
      Pending: 0,
      Interested: 0,
      "Call Back": 0,
      Approved: 0,
      "Not Interested": 0,
    };
    allLeads.forEach((lead: any) => {
      if (statusCounts[lead.status] !== undefined) statusCounts[lead.status]++;
    });

    const approved = statusCounts["Approved"] || 0;
    const total = allLeads.length;
    const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const createdCount = createdLeads.length;
    const assignedCount = assignedLeads.length;

    const createdIds = new Set(createdLeads.map((l: any) => l._id.toString()));
    const bothCount = assignedLeads.filter((l: any) =>
      createdIds.has(l._id.toString())
    ).length;

    return NextResponse.json({
      success: true,
      me: {
        _id: uid,
        name: uname,
        email: (me as any).email,
        phone: (me as any).phone || "",
        role: (me as any).role,
      },
      stats: {
        createdCount,
        assignedCount,
        bothCount,
        total,
        statusCounts,
        conversionRate,
      },
      leads: allLeads,
      createdLeads,
      assignedLeads,
    });
  } catch (err: any) {
    console.error("My Analytics error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}