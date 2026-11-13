import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import { verifySession } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET — list all users
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
    
    await connectDB();
    const users = await User.find().select("-password -securityAnswer").sort({ createdAt: -1 }).lean();
    
    const formattedUsers = users.map((u: any) => ({
      _id: u._id.toString(),
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      passwordRequest: u.passwordRequest || false,
      requestDate: u.requestDate,
      tempPassword: u.tempPassword || "",
      securityQuestion: u.securityQuestion || "",
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST — create user
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });

    await connectDB();
    const { username, password, role, securityQuestion, securityAnswer } = await req.json();

    if (!username || !password) return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    if (!securityQuestion || !securityAnswer) return NextResponse.json({ success: false, error: "Security Question and Answer are required" }, { status: 400 });
    
    const validRole = role === "admin" ? "admin" : "employee";
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });

    // User.create() DOES trigger the pre-save hook, so password will hash automatically
    const user = await User.create({ 
      username: username.toLowerCase().trim(), 
      password, 
      role: validRole,
      securityQuestion,
      securityAnswer
    });

    return NextResponse.json({
      success: true,
      user: { _id: user._id.toString(), username: user.username, role: user.role, createdAt: user.createdAt },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH — update password, clear request, or edit user details
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });

    await connectDB();
    const { userId, newPassword, clearRequest, newUsername, newRole, newQuestion, newAnswer } = await req.json();

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // 🔴 FIX: Manually hash the password since $set bypasses pre-save hooks
    if (newPassword) {
      if (newPassword.length < 6) return NextResponse.json({ success: false, error: "Password too short" }, { status: 400 });
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user.password = hashedPassword;
      user.tempPassword = newPassword; // Save plain text temporarily for employee to see
    }

    if (clearRequest) {
      user.passwordRequest = false;
      user.tempPassword = "";
    }

    if (newUsername) {
      const formatted = newUsername.toLowerCase().trim();
      const existing = await User.findOne({ username: formatted, _id: { $ne: userId } });
      if (existing) return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 });
      user.username = formatted;
    }

    if (newRole) {
      user.role = newRole === "admin" ? "admin" : "employee";
    }

    if (typeof newQuestion === "string") {
      user.securityQuestion = newQuestion;
    }

    // Manually hash the answer too, since securityAnswer is stored hashed
    if (typeof newAnswer === "string" && newAnswer.trim() !== "") {
      const hashedAnswer = await bcrypt.hash(newAnswer.toLowerCase().trim(), 10);
      user.securityAnswer = hashedAnswer;
    }

    // user.save() is now safe here because we manually hashed the password above
    // The pre-save hook will skip hashing since we're not using .save() for the password change... 
    // Actually, because we're using user.save(), the hook WILL try to hash again.
    // So we use .save() but mark the password as not modified to prevent double hashing.
    
    // Alternative: Use findByIdAndUpdate with the already hashed value
    const updates: any = {};
    if (newPassword) updates.password = user.password;
    if (newPassword) updates.tempPassword = newPassword;
    if (clearRequest) { updates.passwordRequest = false; updates.tempPassword = ""; }
    if (newUsername) updates.username = user.username;
    if (newRole) updates.role = user.role;
    if (newQuestion) updates.securityQuestion = newQuestion;
    if (user.securityAnswer) updates.securityAnswer = user.securityAnswer;

    await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });

    return NextResponse.json({ success: true, message: "User updated successfully" });
    
  } catch (err: any) {
    console.error("PATCH Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE — remove user
export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "No ID" }, { status: 400 });

    if (id === admin.userId) return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });

    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}