import { z } from 'zod'

// Server-side mirror of src/features/member-form/validation.ts. Duplicated on
// purpose — SECURITY.md: "Jamais faire confiance au frontend", validation
// must be enforced on both sides independently.

const phoneRegex = /^(\+216)?\d{8}$/
const cinRegex = /^\d{8}$/

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
  fullName: z.string().min(2),
  gender: optionalEnum(['MALE', 'FEMALE']),
  fatherName: z.string().optional(),
  grandfatherName: z.string().optional(),
  motherFullName: z.string().optional(),

  birthDate: optionalDateString,
  birthPlace: z.string().optional(),
  cinNumber: z
    .string()
    .optional()
    .refine((val) => !val || cinRegex.test(val)),
  cinIssuedPlace: z.string().optional(),
  cinIssueDate: optionalDateString,

  address: z.string().min(5),
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

  educationLevel: z.string().optional(),

  profession: z.string().optional(),
  speciality: z.string().optional(),
  employer: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: optionalPhone,
  workFax: z.string().optional(),

  previousAssociations: z.string().optional(),
  sports: z.string().optional(),
  firstAidCertificates: z.string().optional(),

  declarationAccepted: z.literal(true),
  declarationPlace: z.string().optional(),
  signature: z.string().optional(),
  signatureDate: optionalDateString,
})

export type MemberProfileInput = z.infer<typeof memberProfileInputSchema>
