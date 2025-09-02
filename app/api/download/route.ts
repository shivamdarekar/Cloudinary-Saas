import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicId = url.searchParams.get("publicId");
  if (!publicId) return NextResponse.json({ error: "Missing publicId" }, { status: 400 });

  // Build a Cloudinary URL for the mp4 version. Adjust cloud name if needed from env.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });

  const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/video/upload/f_mp4/${publicId}.mp4`;

  // Fetch the media and stream it back to the client
  const resp = await fetch(cloudinaryUrl);
  if (!resp.ok) {
    return NextResponse.json({ error: "Failed to fetch media from Cloudinary" }, { status: resp.status });
  }

  const headers = new Headers();
  headers.set("Content-Type", resp.headers.get("Content-Type") || "application/octet-stream");
  const disposition = `attachment; filename="${publicId}.mp4"`;
  headers.set("Content-Disposition", disposition);

  return new NextResponse(resp.body, { headers });
}
