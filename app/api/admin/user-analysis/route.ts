import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

export async function GET() {
  // IMPORTANT:
  // Keep cookies() outside the try/catch.
  // Next.js needs to handle its own prerendering signal.
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  // 1. Check authentication
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Admin only" },
      { status: 403 }
    );
  }

  // 2. Verify admin session
  let session;

  try {
    session = verifySession(token);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid session" },
      { status: 403 }
    );
  }

  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Admin only" },
      { status: 403 }
    );
  }

  // 3. Fetch user analysis
  try {
    await connectDB();

    const users = await User.find().select("-password").lean();

    const results = await Promise.all(
      users.map(async (u: any) => {
        const uid = u._id.toString();
        const uname = u.name;

        // ✅ FIX: Fetch BOTH leads created by this user AND leads assigned to them.
        // A lead can appear in both sets (created AND assigned to same person).
        const [createdLeads, assignedLeads] = await Promise.all([
          // Leads this person created (permanent ownership)
          Inquiry.find({
            $or: [{ createdById: uid }, { createdBy: uname }],
          })
            .sort({ createdAt: -1 })
            .lean(),

          // Leads currently assigned to this person
          Inquiry.find({ assignedTo: uname })
            .sort({ createdAt: -1 })
            .lean(),
        ]);

        // Union of both sets for the per-status / service / timeline charts.
        // Dedup by _id so a lead that is both created-by and assigned-to
        // this person is only counted once in the charts.
        const unionMap = new Map<string, any>();
        [...createdLeads, ...assignedLeads].forEach((l: any) => {
          unionMap.set(l._id.toString(), l);
        });
        const allLeads = Array.from(unionMap.values());

        // ── Status counts over the UNION (what the charts display)
        const statusCounts: Record<string, number> = {
          Pending: 0,
          Interested: 0,
          "Call Back": 0,
          Approved: 0,
          "Not Interested": 0,
        };
        allLeads.forEach((lead: any) => {
          if (statusCounts[lead.status] !== undefined) {
            statusCounts[lead.status]++;
          }
        });

        // ── Conversion over the union
        const approved = statusCounts["Approved"];
        const total = allLeads.length;
        const conversionRate =
          total > 0 ? Math.round((approved / total) * 100) : 0;

        // ── Created vs assigned split
        const createdCount = createdLeads.length;
        const assignedCount = assignedLeads.length;

        // Overlap = leads that are BOTH created by and assigned to this person
        const createdIds = new Set(createdLeads.map((l: any) => l._id.toString()));
        const bothCount = assignedLeads.filter((l: any) =>
          createdIds.has(l._id.toString())
        ).length;

        // Created but now assigned to someone else (creator still sees these,
        // but someone else is working them)
        const createdAssignedToOther = createdLeads.filter(
          (l: any) => l.assignedTo && l.assignedTo !== uname
        ).length;

        // Created and currently unassigned
        const createdUnassigned = createdLeads.filter(
          (l: any) => !l.assignedTo
        ).length;

        // Assigned leads that this person did NOT create (received from others)
        const assignedFromOthers = assignedLeads.filter((l: any) => {
          const creatorId = (l as any).createdById;
          const creatorName = (l as any).createdBy;
          return !(
            (creatorId && creatorId === uid) ||
            (creatorName && creatorName === uname)
          );
        }).length;

        return {
          _id: uid,
          name: uname,
          email: u.email,
          phone: u.phone || "",
          role: u.role,
          statusCounts,
          conversionRate,

          // ✅ NEW — headline numbers for the panel
          createdCount,
          assignedCount,
          bothCount,
          createdAssignedToOther,
          createdUnassigned,
          assignedFromOthers,

          // Keep the full union so the existing charts still work.
          // You can also expose createdLeads / assignedLeads separately if
          // you want two separate tables later.
          leads: allLeads,
          createdLeads,
          assignedLeads,
        };
      })
    );

    return NextResponse.json({
      success: true,
      analysis: results,
    });
  } catch (err: any) {
    console.error("User Analysis error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}