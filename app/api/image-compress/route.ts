import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { checkRateLimit } from "../../../lib/ratelimit";

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
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
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
    const files = formData.getAll("file");
    
    // Check for multiple files
    if (files.length > 1) {
      return NextResponse.json(
        { error: "Please upload only one image at a time" },
        { status: 400 }
      );
    }
    
    const file = files[0] as File;
    const targetSizeKB = parseInt(formData.get("targetSize") as string);

    // Validate input
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Enhanced target size validation
    if (!targetSizeKB || targetSizeKB <= 0) {
      return NextResponse.json({ error: "Invalid target size" }, { status: 400 });
    }

    const targetSizeBytes = targetSizeKB * 1024;
    const originalSize = file.size;
    const minTargetSize = Math.max(1024, Math.floor(originalSize * 0.01)); // At least 1KB or 1% of original
    const maxTargetSize = Math.floor(originalSize * 0.95); // At most 95% of original

    // Check if target size is achievable
    if (targetSizeBytes >= originalSize) {
      return NextResponse.json(
        { error: "Target size must be smaller than original file size" },
        { status: 400 }
      );
    }

    if (targetSizeBytes < minTargetSize) {
      return NextResponse.json(
        { error: `Target size too small. Minimum: ${Math.ceil(minTargetSize / 1024)}KB` },
        { status: 400 }
      );
    }

    if (targetSizeBytes > maxTargetSize) {
      return NextResponse.json(
        { error: `Target size too close to original. Maximum: ${Math.floor(maxTargetSize / 1024)}KB` },
        { status: 400 }
      );
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

    // Smart compression strategy - try to hit target size iteratively
    const compressionRatio = targetSizeBytes / originalSize;
    // console.log(`Target compression: ${originalSize} -> ${targetSizeBytes} (${Math.round(compressionRatio * 100)}%)`);

    // First upload to get original dimensions
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "compressed-images",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        }
      ).end(buffer);
    });

    const originalWidth = uploadResult.width;
    const originalHeight = uploadResult.height;
    const publicId = uploadResult.public_id;

    // Strategy: Try different quality levels and formats to hit target
    let bestResult: CloudinaryUploadResult | null = null;
    let bestDifference = Infinity;

    // Quality levels to try (from high to low)
    const qualityLevels = compressionRatio > 0.5 
      ? [80, 70, 60, 50, 40] 
      : [70, 60, 50, 40, 30, 20];

    // Try WebP format first (better compression), then JPG
    const formats = ['webp', 'jpg'];
    
    for (const format of formats) {
      for (const quality of qualityLevels) {
        try {
          // Generate URL with transformation
          const transformedUrl = cloudinary.url(publicId, {
            quality: quality,
            format: format,
            flags: 'lossy',
            fetch_format: 'auto',
          });

          // Fetch the transformed image to check size
          const response = await fetch(transformedUrl);
          const arrayBuffer = await response.arrayBuffer();
          const transformedSize = arrayBuffer.byteLength;
          const difference = Math.abs(transformedSize - targetSizeBytes);

          // console.log(`Trying ${format} q:${quality} -> ${transformedSize} bytes (diff: ${difference})`);

          // If this is the closest to target size, save it
          if (difference < bestDifference && transformedSize <= targetSizeBytes * 1.15) {
            bestDifference = difference;
            bestResult = {
              ...uploadResult,
              secure_url: transformedUrl,
              bytes: transformedSize,
              format: format,
            };

            // If we're within 10% of target, that's good enough
            if (transformedSize >= targetSizeBytes * 0.9 && transformedSize <= targetSizeBytes * 1.1) {
              // console.log(`Found optimal compression at ${format} q:${quality}`);
              break;
            }
          }
        } catch (err) {
          // console.error(`Failed to test ${format} q:${quality}:`, err);
        }
      }
      
      // If we found a good match, no need to try other formats
      if (bestResult && bestResult.bytes >= targetSizeBytes * 0.9) {
        break;
      }
    }

    // If still too large, try reducing dimensions
    if (!bestResult || bestResult.bytes > targetSizeBytes * 1.2) {
      // console.log('Trying dimension reduction...');
      const scaleFactor = Math.sqrt(targetSizeBytes / originalSize);
      const newWidth = Math.floor(originalWidth * scaleFactor);
      const newHeight = Math.floor(originalHeight * scaleFactor);

      for (const quality of [60, 50, 40, 30]) {
        try {
          const transformedUrl = cloudinary.url(publicId, {
            quality: quality,
            format: 'webp',
            width: newWidth,
            height: newHeight,
            crop: 'limit',
            flags: 'lossy',
          });

          const response = await fetch(transformedUrl);
          const arrayBuffer = await response.arrayBuffer();
          const transformedSize = arrayBuffer.byteLength;
          const difference = Math.abs(transformedSize - targetSizeBytes);

          // console.log(`Trying resized webp w:${newWidth} q:${quality} -> ${transformedSize} bytes`);

          if (difference < bestDifference) {
            bestDifference = difference;
            bestResult = {
              ...uploadResult,
              secure_url: transformedUrl,
              bytes: transformedSize,
              format: 'webp',
              width: newWidth,
              height: newHeight,
            };

            if (transformedSize <= targetSizeBytes * 1.1) {
              // console.log(`Found optimal with resize at q:${quality}`);
              break;
            }
          }
        } catch (err) {
          // console.error(`Failed to test resize q:${quality}:`, err);
        }
      }
    }

    const result = bestResult || uploadResult;

    // Calculate how close we got to target size
    const achievedRatio = Math.round((result.bytes / targetSizeBytes) * 100);
    const compressionPercentage = Math.round((1 - result.bytes / file.size) * 100);

    // console.log(`Final result: ${result.bytes} bytes (target: ${targetSizeBytes}, ${achievedRatio}% of target)`);

    // Return compression results
    return NextResponse.json({
      url: result.secure_url,
      originalSize: file.size,
      compressedSize: result.bytes,
      targetSize: targetSizeBytes,
      publicId: publicId,
      format: result.format,
      width: result.width,
      height: result.height,
      compressionRatio: compressionPercentage,
      targetAchieved: achievedRatio,
      message: achievedRatio >= 90 && achievedRatio <= 110 
        ? 'Successfully compressed to target size' 
        : `Compressed to ${achievedRatio}% of target size`
    }, { status: 200 });

  } catch (error: any) {
    // console.error("Image compression error:", error);
    return NextResponse.json(
      { error: error.message || "Compression failed" },
      { status: 500 }
    );
  }
}