
import { NextResponse, connection } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

// Admin authentication
async function requireAdmin() {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  const session = verifySession(token);

  if (!session || session.role !== "admin") {
    return null;
  }

  return session;
}

// User Analysis API
export async function GET() {
  try {
    // Ensure execution happens during an actual request
    await connection();

    // 1. Verify admin authentication
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin only",
        },
        { status: 403 }
      );
    }

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Fetch all users without passwords
    const users = await User.find()
      .select("-password")
      .lean();

    // 4. Generate analysis for each user
    const results = await Promise.all(
      users.map(async (u: any) => {

        // Fetch all leads assigned to this user
        const currentLeads = await Inquiry.find({
          assignedTo: u.username,
        })
          .sort({ createdAt: -1 })
          .lean();

        // Initialize lead status counts
        const statusCounts: Record<string, number> = {
          Pending: 0,
          Interested: 0,
          "Call Back": 0,
          Approved: 0,
          "Not Interested": 0,
        };

        // Calculate status-wise counts
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

        // Return user analysis
        return {
          _id: u._id.toString(),
          username: u.username,
          email: u.email,
          phone: u.phone || "",
          role: u.role,
          statusCounts,
          conversionRate,
          leads: currentLeads,
        };
      })
    );

    // 5. Return analysis
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
