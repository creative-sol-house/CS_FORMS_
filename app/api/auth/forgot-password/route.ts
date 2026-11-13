import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, action, answer } = await req.json();
    if (!username) return NextResponse.json({ success: false, error: "Username required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // STEP 1: Fetch the security question
    if (action === "get-question") {
      if (!user.securityQuestion) {
        return NextResponse.json({ success: false, error: "No security question set. Contact Admin." }, { status: 400 });
      }
      return NextResponse.json({ success: true, question: user.securityQuestion });
    }

    // STEP 2: Verify the answer and send request
    if (action === "request") {
      if (!answer) return NextResponse.json({ success: false, error: "Answer required" }, { status: 400 });

      // Check if the answer is correct
      const isMatch = await bcrypt.compare(answer.toLowerCase().trim(), user.securityAnswer || "");
      if (!isMatch) {
         return NextResponse.json({ success: false, error: "Incorrect answer" }, { status: 401 });
      }

      // Rate limit: 5 mins
      if (user.requestDate && (Date.now() - new Date(user.requestDate).getTime() < 5 * 60 * 1000)) {
         return NextResponse.json({ success: false, error: "Please wait 5 minutes before trying again." }, { status: 429 });
      }

      user.passwordRequest = true;
      user.requestDate = new Date();
      user.tempPassword = "";
      await user.save();

      return NextResponse.json({ success: true, message: "Request sent to Admin!" });
    }

    // STEP 3: Reveal the password (requires answer again for security)
    if (action === "check") {
      if (!answer) return NextResponse.json({ success: false, error: "Answer required" }, { status: 400 });

      const isMatch = await bcrypt.compare(answer.toLowerCase().trim(), user.securityAnswer || "");
      if (!isMatch) {
         return NextResponse.json({ success: false, error: "Incorrect answer" }, { status: 401 });
      }

      if (user.tempPassword) {
        const revealedPass = user.tempPassword;
        // Clear it so it can only be seen once
        user.tempPassword = "";
        user.passwordRequest = false;
        await user.save();
        return NextResponse.json({ success: true, status: "ready", password: revealedPass });
      } else {
        return NextResponse.json({ success: true, status: "pending" });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}