import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const session = verifySession(token);
  if (!session) return NextResponse.json({ success: false }, { status: 401 });

  await connectDB();
  
  // Fetch user, excluding sensitive hash fields
  const dbUser = await User.findById(session.userId).select("-password -securityAnswer").lean();
  
  if (!dbUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  // Map the database fields to what the frontend expects
  return NextResponse.json({ 
    success: true, 
    user: { 
      userId: dbUser._id.toString(),
      username: dbUser.username,
      role: dbUser.role,
      passwordRequest: dbUser.passwordRequest,
      // Here we map tempPassword to newPasswordTemp for the frontend
      newPasswordTemp: dbUser.tempPassword 
    } 
  });
}