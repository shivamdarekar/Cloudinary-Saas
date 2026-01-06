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
    const settings = JSON.parse(formData.get('settings') as string)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size limit (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 10MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'optimized',
          transformation: [
            {
              width: settings.width,
              height: settings.height,
              crop: 'fill',
              quality: settings.quality,
              format: settings.format === 'auto' ? 'auto' : settings.format
            }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout - please try again')), 30000)
    )

    const result = await Promise.race([uploadPromise, timeoutPromise]).catch(error => {
      throw new Error(error?.message || 'Upload failed')
    })

    return NextResponse.json({
      optimizedUrl: (result as any).secure_url,
      publicId: (result as any).public_id
    })

  } catch (error: any) {
    // console.error('Image optimization error:', error)
    
    let errorMessage = 'Failed to optimize image';
    
    if (error?.message?.includes('timeout')) {
      errorMessage = "Upload timeout - please check your connection and try again";
    } else if (error?.error?.message === 'Request Timeout' || error?.error?.name === 'TimeoutError') {
      errorMessage = "Cloudinary timeout - please try again";
    } else if (error?.code === 'ENOTFOUND' || error?.message?.includes('ENOTFOUND')) {
      errorMessage = "Network error - please check your connection";
    } else {
      errorMessage = error?.message || error?.error?.message || 'Failed to optimize image';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}