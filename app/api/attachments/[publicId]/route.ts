// app/api/attachments/[publicId]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    return verifySession(token);
  } catch {
    return null;
  }
}

/** Map extension → correct MIME. Cloudinary's raw CDN returns octet-stream,
 *  which makes Chrome download instead of render. This fixes that. */
function mimeFor(publicId: string): string {
  const ext = publicId.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":  return "application/pdf";
    case "doc":  return "application/msword";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":  return "application/vnd.ms-excel";
    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "png":  return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif":  return "image/gif";
    case "webp": return "image/webp";
    case "svg":  return "image/svg+xml";
    case "txt":  return "text/plain; charset=utf-8";
    default:     return "application/octet-stream";
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publicId: rawId } = await params;
  let publicId = rawId;
  try {
    publicId = decodeURIComponent(publicId);
  } catch {}

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const candidates = [
    `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`,
    `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
  ];

  let upstream: Response | null = null;
  for (const url of candidates) {
    const r = await fetch(url);
    if (r.ok) {
      upstream = r;
      break;
    }
  }

  if (!upstream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buf = await upstream.arrayBuffer();
  const contentType = mimeFor(publicId);
  const filename = publicId.split("/").pop() || "file";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      // Force browser to try to display it, not download it
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}