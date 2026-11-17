
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });

    await connectDB();

    const users = await User.find().select("-password").lean();

    const results = await Promise.all(
      users.map(async (u: any) => {
        // 1. Get the actual full lead documents assigned to this user
        const currentLeads = await Inquiry.find({ assignedTo: u.username })
          .sort({ createdAt: -1 })
          .lean();

        // 2. Get counts for the summary cards
        const statusCounts = {
          Pending: 0,
          Interested: 0,
          "Call Back": 0,
          Approved: 0,
          "Not Interested": 0,
        } as Record<string, number>;

        currentLeads.forEach((l: any) => {
          if (statusCounts[l.status] !== undefined) statusCounts[l.status]++;
        });

        const approved = statusCounts["Approved"];
        const total = currentLeads.length;
        const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        return {
          _id: u._id.toString(),
          username: u.username,
          email: u.email,
          phone: u.phone || "",
          role: u.role,
          statusCounts,
          conversionRate,
          leads: currentLeads, // Pass the actual leads!
        };
      })
    );

    return NextResponse.json({ success: true, analysis: results });
  } catch (err: any) {
    console.error("User Analysis error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}