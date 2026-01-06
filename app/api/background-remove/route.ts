import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { checkRateLimit } from '../../../lib/ratelimit'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    // Validate Cloudinary configuration
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('file')
    
    // Check for multiple files
    if (files.length > 1) {
      return NextResponse.json(
        { error: 'Please upload only one image at a time' },
        { status: 400 }
      )
    }
    
    const file = files[0] as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size limit (10MB for Cloudinary free tier)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'background-removed',
          transformation: [
            { effect: 'background_removal' }
          ],
          format: 'png'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      processedUrl: (result as any).secure_url,
      publicId: (result as any).public_id
    })

  } catch (error: any) {
    // console.error('Background removal error:', error)
    
    // Handle specific Cloudinary errors
    if (error.http_code === 400 && error.message?.includes('File size too large')) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB for background removal.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    )
  }
}