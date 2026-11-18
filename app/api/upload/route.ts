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

export async function POST(req: Request) {
  try {
    // 1. Verify Session
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const session = verifySession(token);
    if (!session) return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });

    // 2. Get Image Data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const targetUserId = formData.get("userId") as string; // Admin can upload for others
    
    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

    // 3. Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "crm_profiles", transformation: [{ width: 200, height: 200, crop: "fill" }] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const imageUrl = (uploadResult as any).secure_url;

    // 4. ONLY save to DB if targetUserId is provided (Edit mode)
    // If creating a new user, we just return the URL to the frontend.
    if (targetUserId) {
      // Security: Only admins can update other users' pictures
      const userIdToUpdate = session.role === "admin" ? targetUserId : session.userId;
      
      await connectDB();
      await User.findByIdAndUpdate(userIdToUpdate, { $set: { profilePicture: imageUrl } });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}