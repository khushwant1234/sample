import { createClient } from '@/lib/supabase/server'

// Upload image to Supabase Storage
export async function uploadImageToStorage(
  imageData: string, 
  filename: string
): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64')
      // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('generated-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading image to storage:', error)
    throw error
  }
}

// Delete image from storage (optional cleanup function)
export async function deleteImageFromStorage(filename: string): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.storage
      .from('generated-images')
      .remove([filename])

    if (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting image from storage:', error)
    throw error
  }
}
