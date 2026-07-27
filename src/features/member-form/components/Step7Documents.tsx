import { useState, type ChangeEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FileText, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { uploadMemberDocument, validateDocumentFile } from '@/services/storageService'
import type { MemberFormValues } from '@/features/member-form/validation'

interface UploadedFile {
  name: string
  url: string
}

export function Step7Documents({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { register } = form

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return

    const validationError = validateDocumentFile(file)
    if (validationError) {
      setUploadError(t(validationError))
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const { url } = await uploadMemberDocument(user.id, 'certificates', 'CERTIFICATE', file)
      setUploadedFiles((prev) => [...prev, { name: file.name, url }])
    } catch {
      setUploadError(t('memberForm.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('memberForm.fields.firstAidCertificates')}
        {...register('firstAidCertificates')}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">{t('memberForm.uploadLabel')}</label>
        <p className="text-xs text-slate-500">{t('memberForm.uploadHint')}</p>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-primary hover:text-primary">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {t('memberForm.uploadCta')}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            disabled={uploading || !user}
            onChange={(event) => void handleFileChange(event)}
          />
        </label>

        {uploadError && <p className="text-sm text-error">{uploadError}</p>}

        {uploadedFiles.length > 0 && (
          <ul className="flex flex-col gap-1">
            {uploadedFiles.map((file) => (
              <li key={file.url} className="text-sm text-slate-600">
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
