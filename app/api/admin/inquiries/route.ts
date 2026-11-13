import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    
    // Admin sees all leads. Employees only see their primary or secondary assignments.
    const query = session.role === "admin" 
      ? {} 
      : { $or: [{ primaryAssignee: session.username }, { secondaryAssignees: session.username }] };

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, inquiries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id, updates } = await req.json();

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Build Audit Log based on changes
    const logDetails = [];
    if (updates.status && updates.status !== inquiry.status) {
      logDetails.push(`Status: ${inquiry.status} → ${updates.status}`);
    }
    if (updates.communicationMode && updates.communicationMode !== inquiry.communicationMode) {
      logDetails.push(`Comm Mode: ${updates.communicationMode}`);
    }
    if (updates.notes !== undefined && updates.notes !== inquiry.notes) {
      logDetails.push(`Notes updated`);
    }
    if (updates.primaryAssignee !== undefined) {
      logDetails.push(`Primary assignee: ${updates.primaryAssignee || 'None'}`);
    }
    if (updates.secondaryAssignees !== undefined) {
      logDetails.push(`Secondary assignees updated`);
    }

    let updateQuery: any = { $set: updates };
    
    if (logDetails.length > 0) {
      updateQuery.$push = { 
        auditLogs: {
          action: "Update",
          details: logDetails.join(", "),
          performedBy: session.username,
          timestamp: new Date()
        } 
      };
    }

    const updated = await Inquiry.findByIdAndUpdate(id, updateQuery, { new: true }).lean();
    return NextResponse.json({ success: true, inquiry: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "No ID" }, { status: 400 });

    await connectDB();
    await Inquiry.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}