import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import { sendMail, passwordRequestAdminEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email address is required." }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find the user strictly by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ success: false, error: "No account found with this email." }, { status: 404 });
    }

    // 2. Rate Limiting (5 mins)
    if (user.requestDate && Date.now() - new Date(user.requestDate).getTime() < 5 * 60 * 1000) {
      const minutesLeft = Math.ceil((5 * 60 * 1000 - (Date.now() - new Date(user.requestDate).getTime())) / 60000);
      return NextResponse.json({ success: false, error: `Please wait ${minutesLeft} minutes before trying again.` }, { status: 429 });
    }

    // 3. Save request
    user.passwordRequest = true;
    user.requestDate = new Date();
    await user.save();

    // 4. Notify Admins
    let emailStatus = "emails sent successfully";
    
    try {
      // Find all admins
      const admins = await User.find({ role: "admin" }).select("email name").lean();
      
      // Get valid emails from DB
      let targetEmails = admins
        .filter((a) => a.email && a.email.trim() !== "")
        .map((a) => a.email as string);
      
      // FALLBACK: If no admin emails found in DB, use the SMTP_USER from .env
      if (targetEmails.length === 0) {
        console.warn("⚠️ No admin emails in DB. Falling back to SMTP_USER.");
        if (!process.env.SMTP_USER) throw new Error("No fallback email available.");
        targetEmails = [process.env.SMTP_USER];
      }

      const tpl = passwordRequestAdminEmail(user.name, user.email);
      
      // Send to all valid admins (or the fallback)
      await Promise.all(
        targetEmails.map((adminEmail) => sendMail({ to: adminEmail, subject: tpl.subject, html: tpl.html }))
      );
      
      console.log(`✅ Password request for ${user.name} (${user.email}) sent to: ${targetEmails.join(", ")}`);
    } catch (mailErr: any) {
      console.error("❌ Admin notify email failed:", mailErr.message);
      emailStatus = "request saved, but email notification failed. Check server logs.";
    }

    return NextResponse.json({ 
      success: true, 
      message: `Request sent. ${emailStatus}` 
    });
    
  } catch (err: any) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}