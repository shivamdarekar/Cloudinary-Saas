import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@clerk/nextjs/server'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Fallback tags based on image analysis
function generateFallbackTags(filename: string, size: number): string[] {
  const tags: string[] = []
  
  // File type based tags
  const ext = filename.toLowerCase().split('.').pop()
  if (ext) {
    tags.push(ext === 'jpg' || ext === 'jpeg' ? 'photo' : ext)
  }
  
  // Size based tags
  const sizeInMB = size / (1024 * 1024)
  if (sizeInMB > 5) tags.push('high-resolution')
  else if (sizeInMB < 0.5) tags.push('thumbnail')
  else tags.push('standard-quality')
  
  // Generic tags
  tags.push('image', 'digital', 'upload')
  
  return [...new Set(tags)]
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Try Cloudinary auto-tagging first
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'auto-tagged',
            categorization: 'google_tagging',
            auto_tagging: 0.7
          },
          (error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          }
        ).end(buffer)
      })

      const tags = (result as any).tags || []
      const categories = (result as any).categorization || []
      const allTags = [...tags, ...categories.map((cat: any) => cat.name || cat)]
      const uniqueTags = [...new Set(allTags)].filter(tag => tag && tag.length > 0)

      return NextResponse.json({
        tags: uniqueTags,
        imageUrl: (result as any).secure_url
      })

    } catch (cloudinaryError: any) {
      console.log('Cloudinary auto-tagging failed, using fallback method')
      
      // Upload without auto-tagging
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'auto-tagged'
          },
          (error, result) => {
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
          }
        ).end(buffer)
      })

      // Generate fallback tags
      const fallbackTags = generateFallbackTags(file.name, file.size)
      
      return NextResponse.json({
        tags: fallbackTags,
        imageUrl: (result as any).secure_url,
        message: 'Auto-tagging requires premium subscription. Using basic analysis.'
      })
    }

  } catch (error: any) {
    console.error('Auto tagging error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    )
  }
}