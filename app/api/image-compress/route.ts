import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate Cloudinary config
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetSizeKB = parseInt(formData.get("targetSize") as string);

    // Validate input
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!targetSizeKB || targetSizeKB <= 0) {
      return NextResponse.json({ error: "Invalid target size" }, { status: 400 });
    }

    // Check file type - include HEIC for iPhone compatibility
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const isValidType = allowedTypes.includes(file.type) || 
                       /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
    
    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed" },
        { status: 400 }
      );
    }

    // Check max file size (e.g., 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const targetSizeBytes = targetSizeKB * 1024;
    const originalSize = file.size;

    // Check if target size is smaller than original
    if (targetSizeBytes >= originalSize) {
      return NextResponse.json(
        { error: "Target size must be smaller than original file size" },
        { status: 400 }
      );
    }

    // Calculate quality more aggressively based on target size
    const compressionRatio = targetSizeBytes / originalSize;
    let quality: number;
    let width: number | undefined;
    let height: number | undefined;

    // More aggressive quality reduction
    if (compressionRatio >= 0.85) {
      quality = 80;
    } else if (compressionRatio >= 0.7) {
      quality = 65;
    } else if (compressionRatio >= 0.5) {
      quality = 50;
    } else if (compressionRatio >= 0.3) {
      quality = 35;
    } else if (compressionRatio >= 0.2) {
      quality = 25;
    } else if (compressionRatio >= 0.1) {
      quality = 15;
    } else {
      quality = 10;
      // For very aggressive compression, also reduce dimensions
      width = 800;
      height = 600;
    }

    // Build transformation array
    const transformations: any[] = [
      { quality: quality },
      { fetch_format: "auto" },
      { flags: "lossy" }
    ];

    // Add resizing if needed for extreme compression
    if (width && height) {
      transformations.unshift({ width, height, crop: "limit" });
    }

    // Upload to Cloudinary with compression
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "compressed-images",
          transformation: transformations
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      ).end(buffer);
    });

    // Calculate how close we got to target size
    const achievedRatio = Math.round((result.bytes / targetSizeBytes) * 100);
    const compressionPercentage = Math.round((1 - result.bytes / file.size) * 100);

    // Return compression results
    return NextResponse.json({
      url: result.secure_url,
      originalSize: file.size,
      compressedSize: result.bytes,
      targetSize: targetSizeBytes,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      compressionRatio: compressionPercentage,
      targetAchieved: achievedRatio,
      quality: quality
    }, { status: 200 });

  } catch (error: any) {
    console.error("Image compression error:", error);
    return NextResponse.json(
      { error: error.message || "Compression failed" },
      { status: 500 }
    );
  }
}