import { getSupabaseClient } from '@/services/supabaseClient'
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

// The "members" bucket is private (CIN copies and certificates are
// sensitive per MEMBER_FORM.md's confidentiality rules), so we store the
// storage path — not a public URL — and mint short-lived signed URLs only
// when a document actually needs to be displayed.
async function uploadFile(
  userId: string,
  folder: 'cin' | 'certificates' | 'profile',
  file: File,
): Promise<string> {
  const supabase = await getSupabaseClient()
  const path = `${userId}/${folder}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function uploadMemberDocument(
  userId: string,
  folder: 'cin' | 'certificates' | 'profile',
  documentType: DocumentType,
  file: File,
): Promise<{ path: string }> {
  const path = await uploadFile(userId, folder, file)

  const supabase = await getSupabaseClient()
  const { error } = await supabase
    .from('documents')
    .insert({ user_id: userId, type: documentType, url: path })

  if (error) throw error

  return { path }
}

export async function getSignedDocumentUrl(path: string, expiresInSeconds = 60): Promise<string> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}
