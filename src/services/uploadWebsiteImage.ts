import { supabase } from '../supabase'

export interface WebsiteImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Uploads a website asset (logo, landing background…) to the shared
 * "website" Supabase storage bucket and returns its public URL.
 * @param file - The image file to upload
 * @param prefix - File name prefix ("logo" | "background"…)
 */
export async function uploadWebsiteImage(
  file: File,
  prefix: string = 'asset'
): Promise<WebsiteImageUploadResult> {
  try {
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${prefix}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('website')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Website image upload error:', error)
      return { success: false, error: error.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('website')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Unexpected error during website image upload:', error)
    return { success: false, error: 'An unexpected error occurred during upload' }
  }
}
