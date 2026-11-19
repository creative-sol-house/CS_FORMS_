import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifySession(token);
    if (!session) return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });

    await connectDB();

    // 1. Fetch all leads (or filter by user if BD)
    const query = session.role === "admin" 
      ? {} 
      : { $or: [{ createdById: session.userId }, { assignedTo: session.name }] };

    const leads = await Inquiry.find(query).lean();

    // 2. KPI Calculations
    const totalLeads = leads.length;
    const approved = leads.filter(l => l.status === "Approved").length;
    const pending = leads.filter(l => l.status === "Pending").length;
    const notInterested = leads.filter(l => l.status === "Not Interested").length;
    const conversionRate = totalLeads > 0 ? ((approved / totalLeads) * 100).toFixed(1) : "0.0";

    // 3. Service Breakdown
    const leadsByService = [
      { name: "Automation", count: leads.filter(l => l.serviceCategory === "Automation Software").length },
      { name: "Web Dev", count: leads.filter(l => l.serviceCategory === "Web Development").length },
      { name: "Logo", count: leads.filter(l => l.serviceCategory === "Logo Design").length },
      { name: "Marketing", count: leads.filter(l => l.serviceCategory === "Digital Marketing").length },
    ];

    // 4. Activity Tracking (Follow-ups)
    const allFollowUps = leads.flatMap(l => l.followUps || []);
    const calls = allFollowUps.filter(f => f.type === "Call").length;
    const meetings = allFollowUps.filter(f => f.type === "Meeting").length;

    // 5. Recent Activity (Last 5 follow-ups)
    const recentActivity = allFollowUps
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(f => ({
        date: f.date,
        type: f.type,
        note: f.note,
        loggedBy: f.loggedBy
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        approved,
        pending,
        notInterested,
        conversionRate,
        leadsByService,
        calls,
        meetings,
        recentActivity,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}