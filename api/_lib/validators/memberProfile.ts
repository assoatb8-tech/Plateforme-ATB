import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

// Server-side mirror of src/features/member-form/validation.ts. Duplicated on
// purpose — SECURITY.md: "Jamais faire confiance au frontend", validation
// must be enforced on both sides independently.

const phoneRegex = /^(\+216)?\d{8}$/
const cinRegex = /^\d{8}$/

// Strip first, then validate length against the real (post-strip) content.
const sanitizedText = (min: number) => z.string().transform(stripHtmlTags).pipe(z.string().min(min))
const optionalSanitizedText = z
  .string()
  .optional()
  .transform((val) => (val === undefined ? undefined : stripHtmlTags(val)))

const optionalDateString = z
  .string()
  .optional()
  .refine((val) => !val || !Number.isNaN(Date.parse(val)))

const optionalPhone = z
  .string()
  .optional()
  .refine((val) => !val || phoneRegex.test(val))

// Guards against a direct API call (bypassing the frontend form) sending ""
// for an unset <select> instead of omitting the key entirely.
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val)
function optionalEnum<const T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional())
}

export const memberProfileInputSchema = z.object({
  fullName: sanitizedText(2),
  gender: optionalEnum(['MALE', 'FEMALE']),
  fatherName: optionalSanitizedText,
  grandfatherName: optionalSanitizedText,
  motherFullName: optionalSanitizedText,

  birthDate: optionalDateString,
  birthPlace: optionalSanitizedText,
  cinNumber: z
    .string()
    .optional()
    .refine((val) => !val || cinRegex.test(val)),
  cinIssuedPlace: optionalSanitizedText,
  cinIssueDate: optionalDateString,

  address: sanitizedText(5),
  phoneHome: optionalPhone,
  phoneMobile: z.string().regex(phoneRegex),
  contactEmail: z.string().email().optional().or(z.literal('')),

  maritalStatus: optionalEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  childrenCount: z.number().int().min(0).optional(),
  bloodType: optionalEnum([
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
    'O_POSITIVE',
    'O_NEGATIVE',
  ]),

  educationLevel: optionalSanitizedText,

  profession: optionalSanitizedText,
  speciality: optionalSanitizedText,
  employer: optionalSanitizedText,
  employerAddress: optionalSanitizedText,
  employerPhone: optionalPhone,
  workFax: optionalSanitizedText,

  previousAssociations: optionalSanitizedText,
  sports: optionalSanitizedText,
  firstAidCertificates: optionalSanitizedText,

  declarationAccepted: z.literal(true),
  declarationPlace: optionalSanitizedText,
  signature: optionalSanitizedText,
  signatureDate: optionalDateString,
})

export type MemberProfileInput = z.infer<typeof memberProfileInputSchema>
