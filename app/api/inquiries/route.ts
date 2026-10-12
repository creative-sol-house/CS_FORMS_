import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const doc = await Inquiry.create(body);
    return NextResponse.json({ success: true, id: doc._id });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}