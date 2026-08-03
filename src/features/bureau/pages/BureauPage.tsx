import { useTranslation } from 'react-i18next'
import { Facebook, Mail, Phone, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useBureauMembers } from '@/features/bureau/hooks/useBureau'

export function BureauPage() {
  const { t } = useTranslation()
  const { data: members, isLoading, isError } = useBureauMembers()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('bureau.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('bureau.subtitle')}</p>
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <Spinner label={t('bureau.loading')} />
        </div>
      )}
      {isError && <p className="text-center text-sm text-error">{t('bureau.errorGeneric')}</p>}

      {!isLoading && !isError && members && members.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('bureau.noneYet')}</p>
        </div>
      )}

      {!isLoading && members && members.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-base font-semibold text-slate-900">
                {member.firstName} {member.lastName}
              </h2>
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary"
              >
                <Phone size={14} className="shrink-0" />
                {member.phone}
              </a>
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary"
              >
                <Mail size={14} className="shrink-0" />
                {member.email}
              </a>
              <a
                href={member.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#1877F2]/10 px-4 py-2 text-sm font-medium text-[#1877F2] transition-colors hover:bg-[#1877F2]/20"
              >
                <Facebook size={16} />
                {t('bureau.viewOnFacebook')}
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
