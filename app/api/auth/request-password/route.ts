import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: "No token" }, { status: 401 });
    }
    
    const session = verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await connectDB();
    
    // Find the user first
    const user = await User.findById(session.userId);
    if (!user) {
       return NextResponse.json({ success: false, error: "User not found in DB" }, { status: 404 });
    }

    // Set the flag and save
    user.passwordRequest = true;
    await user.save();

    console.log(`✅ [DB SAVED] Password request set to true for: ${user.name}`);

    // Return a JSON body with a non-zero content-length
    return NextResponse.json({ 
      success: true, 
      message: "Request saved successfully" 
    });
    
  } catch (err: any) {
    console.error("❌ [API ERROR]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}