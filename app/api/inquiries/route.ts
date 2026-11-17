import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import { resolveLocation } from "@/lib/location";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const submissionLocation = await resolveLocation(req);

    const doc = await Inquiry.create({ ...body, submissionLocation });
    return NextResponse.json({ success: true, id: doc._id });
  } catch (err: any) {
    console.error("❌ Inquiry API error:", err.name, err.message);
    return NextResponse.json(
      { success: false, error: err.message, name: err.name },
      { status: 500 }
    );
  }
}