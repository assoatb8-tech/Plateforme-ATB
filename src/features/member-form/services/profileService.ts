import { apiRequest } from '@/services/apiClient'
import type { MemberFormValues } from '@/features/member-form/validation'

// Raw shape of what GET/POST/PATCH /api/profile return: the Prisma
// MemberProfile row, JSON-serialized (Date fields arrive as ISO strings,
// unset optional fields as null rather than undefined — unlike
// MemberFormValues, whose Zod schema only ever produces undefined).
export interface MemberProfileDto {
  id: string
  userId: string
  firstNameFr: string
  lastNameFr: string
  firstNameAr: string
  lastNameAr: string
  photoUrl: string | null
  gender: 'MALE' | 'FEMALE' | null
  fatherName: string | null
  grandfatherName: string | null
  motherFullName: string | null
  birthDate: string | null
  birthPlace: string | null
  cinNumber: string | null
  cinIssuedPlace: string | null
  cinIssueDate: string | null
  address: string
  phoneHome: string | null
  phoneMobile: string
  contactEmail: string | null
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null
  childrenCount: number | null
  bloodType:
    | 'A_POSITIVE'
    | 'A_NEGATIVE'
    | 'B_POSITIVE'
    | 'B_NEGATIVE'
    | 'AB_POSITIVE'
    | 'AB_NEGATIVE'
    | 'O_POSITIVE'
    | 'O_NEGATIVE'
    | null
  educationLevel: string | null
  profession: string | null
  speciality: string | null
  employer: string | null
  employerAddress: string | null
  employerPhone: string | null
  workFax: string | null
  previousAssociations: string | null
  sports: string | null
  firstAidCertificates: string | null
  declarationAccepted: boolean
  declarationPlace: string | null
  signature: string | null
  signatureDate: string | null
  createdAt: string
  updatedAt: string
}

// Prisma dates are serialized as full ISO datetimes; <input type="date">
// only accepts the yyyy-mm-dd portion.
function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

export function profileToFormValues(profile: MemberProfileDto): MemberFormValues {
  return {
    firstNameFr: profile.firstNameFr,
    lastNameFr: profile.lastNameFr,
    firstNameAr: profile.firstNameAr,
    lastNameAr: profile.lastNameAr,
    photoUrl: profile.photoUrl ?? '',
    gender: profile.gender ?? undefined,
    fatherName: profile.fatherName ?? '',
    grandfatherName: profile.grandfatherName ?? '',
    motherFullName: profile.motherFullName ?? '',
    birthDate: toDateInputValue(profile.birthDate),
    birthPlace: profile.birthPlace ?? '',
    cinNumber: profile.cinNumber ?? '',
    cinIssuedPlace: profile.cinIssuedPlace ?? '',
    cinIssueDate: toDateInputValue(profile.cinIssueDate),
    address: profile.address,
    phoneHome: profile.phoneHome ?? '',
    phoneMobile: profile.phoneMobile,
    contactEmail: profile.contactEmail ?? '',
    maritalStatus: profile.maritalStatus ?? undefined,
    childrenCount: profile.childrenCount ?? undefined,
    bloodType: profile.bloodType ?? undefined,
    educationLevel: profile.educationLevel ?? '',
    profession: profile.profession ?? '',
    speciality: profile.speciality ?? '',
    employer: profile.employer ?? '',
    employerAddress: profile.employerAddress ?? '',
    employerPhone: profile.employerPhone ?? '',
    workFax: profile.workFax ?? '',
    previousAssociations: profile.previousAssociations ?? '',
    sports: profile.sports ?? '',
    firstAidCertificates: profile.firstAidCertificates ?? '',
    declarationAccepted: profile.declarationAccepted,
    declarationPlace: profile.declarationPlace ?? '',
    signature: profile.signature ?? '',
    signatureDate: toDateInputValue(profile.signatureDate),
  }
}

export async function submitMemberProfile(values: MemberFormValues): Promise<void> {
  await apiRequest('/api/profile', { method: 'POST', body: values })
}

export async function updateMemberProfile(values: MemberFormValues): Promise<void> {
  await apiRequest('/api/profile', { method: 'PATCH', body: values })
}

export async function getMemberProfile(): Promise<MemberProfileDto | null> {
  return apiRequest<MemberProfileDto | null>('/api/profile')
}
