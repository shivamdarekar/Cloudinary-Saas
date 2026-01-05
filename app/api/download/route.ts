import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url: imageUrl, filename } = await request.json();
    if (!imageUrl) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: resp.status });
    }

    const headers = new Headers();
    const contentType = resp.headers.get("Content-Type") || "image/jpeg";
    headers.set("Content-Type", contentType);
    
    const defaultFilename = `processed-image-${Date.now()}.jpg`;
    headers.set("Content-Disposition", `attachment; filename="${filename || defaultFilename}"`);

    return new NextResponse(resp.body, { headers });
  } catch (error) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
