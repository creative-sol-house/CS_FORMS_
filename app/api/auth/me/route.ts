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
  const dbUser = await User.findById(session.userId).select("-password").lean();

  if (!dbUser) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      userId: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone || "",
      profilePicture: dbUser.profilePicture || "",
      role: dbUser.role,
      passwordRequest: dbUser.passwordRequest || false,
    },
  });
}