import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/User";
import { verifySession } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Limits / allow-lists ──────────────────────────────────────────────
const PROFILE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const LEAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const LEAD_MIME_ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];




export async function POST(req: Request) {
  try {
    // 1. Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    const session = verifySession(token);
    if (!session)
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );

    // 2. Read form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetUserId = formData.get("userId") as string | null;
    const kind = ((formData.get("kind") as string) || "profile").toLowerCase();

    if (!file)
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );

    // ── Branch A: LEAD ATTACHMENT ──────────────────────────────────────
    if (kind === "lead") {
      if (file.size > LEAD_MAX_BYTES)
        return NextResponse.json(
          { success: false, error: "Max 10 MB per file" },
          { status: 400 }
        );

      if (!LEAD_MIME_ALLOWED.includes(file.type))
        return NextResponse.json(
          { success: false, error: "Only PDF, Word, or Excel allowed" },
          { status: 400 }
        );

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "leads/extra-content",
              resource_type: "raw", // required for docs / pdfs
              public_id: `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`,
            },
            (error, result) => (error ? reject(error) : resolve(result))
          )
          .end(buffer);
      });

      return NextResponse.json({
        success: true,
        attachment: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: session.name,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    // ── Branch B: PROFILE PICTURE (existing behavior) ──────────────────
    if (file.size > PROFILE_MAX_BYTES)
      return NextResponse.json(
        { success: false, error: "Profile picture must be under 5 MB" },
        { status: 400 }
      );

    if (!file.type.startsWith("image/"))
      return NextResponse.json(
        { success: false, error: "Profile picture must be an image" },
        { status: 400 }
      );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "crm_profiles",
            transformation: [{ width: 200, height: 200, crop: "fill" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const imageUrl = uploadResult.secure_url;

    // Only persist to DB if an explicit targetUserId was supplied (edit mode)
    if (targetUserId) {
      const userIdToUpdate =
        session.role === "admin" ? targetUserId : session.userId;
      await connectDB();
      await User.findByIdAndUpdate(userIdToUpdate, {
        $set: { profilePicture: imageUrl },
      });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}