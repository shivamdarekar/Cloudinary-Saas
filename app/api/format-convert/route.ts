import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { checkRateLimit } from "../../../lib/ratelimit";
import { extractFileFormat } from "../../../lib/fileUtils";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      // console.error('Cloudinary environment variables are not configured');
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please set up your environment variables.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetFormat = formData.get("format") as string;
    const quality = formData.get("quality") as string || "auto";

    if (!file || !targetFormat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // console.log('Converting file:', file.name, 'to', targetFormat);
    // console.log('File type:', file.type);
    // console.log('File size:', file.size);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "format-converted",
          format: targetFormat,
          transformation: [
            { quality: quality }
          ]
        },
        (error, result) => {
          if (error) {
            // console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            // console.log('Cloudinary upload success:', result?.public_id);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });

    // Extract original format safely
    const originalFormat = extractFileFormat(file).toLowerCase();

    return NextResponse.json({
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
      format: (result as any).format,
      size: (result as any).bytes,
      originalFormat: originalFormat
    });

  } catch (error: any) {
    // console.error("Format conversion error:", error);
    // console.error("Error details:", JSON.stringify(error, null, 2));
    
    const errorMessage = error?.message || error?.error?.message || "Conversion failed";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}