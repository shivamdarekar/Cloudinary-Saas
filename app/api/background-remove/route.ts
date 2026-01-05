import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@clerk/nextjs/server'
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

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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

  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    )
  }
}