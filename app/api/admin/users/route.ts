import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import { verifySession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendMail, welcomeEmail, passwordChangedEmail } from "@/lib/mailer";

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
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

    const formattedUsers = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      profilePicture: u.profilePicture || "",
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      passwordRequest: u.passwordRequest || false,
      requestDate: u.requestDate,
      tempPassword: u.tempPassword || "",
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
    const { name, password, role, email, phone, profilePicture } = await req.json();

    if (!name || !password || !email) {
      return NextResponse.json({ success: false, error: "Name, email and password required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const validRole = role === "admin" ? "admin" : "business_developer";
    const lowerEmail = email.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: lowerEmail });
    if (existingEmail) return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 });

    const user = await User.create({
      name,
      email: lowerEmail,
      phone: phone || "",
      password,
      tempPassword: password, // Store plain text version for admin dashboard reveal
      role: validRole,
      profilePicture: profilePicture || "",
    });

    // Fire welcome email (non-blocking failure)
    try {
      const tpl = welcomeEmail(user.name, password, user.email);
      await sendMail({ to: user.email, subject: tpl.subject, html: tpl.html });
    } catch (mailErr) {
      console.error("Welcome email failed:", mailErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
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
    const {
      userId,
      newPassword,
      clearRequest,
      newName,
      newRole,
      newEmail,
      newPhone,
    } = await req.json();

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const updates: any = {};
    let plainPasswordForEmail: string | null = null;

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: "Password too short" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.password = hashed;
      updates.tempPassword = newPassword; // Store temp password for admin dashboard reference
      plainPasswordForEmail = newPassword;
    }

    if (clearRequest) {
      updates.passwordRequest = false;
      updates.tempPassword = "";
    }

    if (newName) {
      updates.name = newName.trim();
    }

    if (newEmail) {
      const formatted = newEmail.toLowerCase().trim();
      const existing = await User.findOne({ email: formatted, _id: { $ne: userId } });
      if (existing) return NextResponse.json({ success: false, error: "Email already taken" }, { status: 409 });
      updates.email = formatted;
    }

    if (newPhone !== undefined) updates.phone = newPhone;

    if (newRole) updates.role = newRole === "admin" ? "admin" : "business_developer";

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });

    // Send email when password was set
    if (plainPasswordForEmail && updatedUser) {
      try {
        const tpl = passwordChangedEmail(updatedUser.name, plainPasswordForEmail);
        await sendMail({ to: updates.email || user.email, subject: tpl.subject, html: tpl.html });
      } catch (mailErr) {
        console.error("Password-changed email failed:", mailErr);
      }
    }

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

    if (id === admin.userId) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}