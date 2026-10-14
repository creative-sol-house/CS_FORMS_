import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    console.log("📥 SERVER body:", JSON.stringify(body, null, 2));

    const doc = await Inquiry.create(body);
    console.log("💾 SAVED doc:", JSON.stringify(doc.toObject(), null, 2));

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err: any) {
    console.error("❌ API error:", err.name, err.message);
    return NextResponse.json(
      { success: false, error: err.message, name: err.name },
      { status: 500 }
    );
  }
}