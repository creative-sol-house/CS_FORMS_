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

    const users = await User.find()
      .select("-password")
      .lean();

    const results = await Promise.all(
      users.map(async (u: any) => {
        // Fetch assigned leads by user name
        const currentLeads = await Inquiry.find({
          assignedTo: u.name,
        })
          .sort({ createdAt: -1 })
          .lean();

        // Initialize status counts
        const statusCounts: Record<string, number> = {
          Pending: 0,
          Interested: 0,
          "Call Back": 0,
          Approved: 0,
          "Not Interested": 0,
        };

        // Count leads by status
        currentLeads.forEach((lead: any) => {
          if (statusCounts[lead.status] !== undefined) {
            statusCounts[lead.status]++;
          }
        });

        // Calculate conversion rate
        const approved = statusCounts["Approved"];
        const total = currentLeads.length;

        const conversionRate =
          total > 0
            ? Math.round((approved / total) * 100)
            : 0;

        return {
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          role: u.role,
          statusCounts,
          conversionRate,
          leads: currentLeads,
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