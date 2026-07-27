import { supabase } from '@/services/supabaseClient'
import type { DocumentType } from '@/types/domain'

const BUCKET = 'members'

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf']
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export function validateDocumentFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'memberForm.uploadInvalidType'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'memberForm.uploadTooLarge'
  }
  return null
}

async function uploadFile(
  userId: string,
  folder: 'cin' | 'certificates' | 'profile',
  file: File,
): Promise<string> {
  const path = `${userId}/${folder}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadMemberDocument(
  userId: string,
  folder: 'cin' | 'certificates' | 'profile',
  documentType: DocumentType,
  file: File,
): Promise<{ url: string }> {
  const url = await uploadFile(userId, folder, file)

  const { error } = await supabase
    .from('documents')
    .insert({ user_id: userId, type: documentType, url })

  if (error) throw error

  return { url }
}
