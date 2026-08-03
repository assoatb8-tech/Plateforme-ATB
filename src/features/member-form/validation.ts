import { z } from 'zod'

// Tunisian mobile/fixed numbers: 8 digits, optional +216 prefix.
const phoneRegex = /^(\+216)?\d{8}$/
// CIN: 8 digits (MEMBER_FORM.md: "longueur correcte, uniquement caractères autorisés").
const cinRegex = /^\d{8}$/

const optionalDateString = z
  .string()
  .optional()
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: 'validation.invalidDate' })

const optionalPhone = z
  .string()
  .optional()
  .refine((val) => !val || phoneRegex.test(val), { message: 'validation.phoneInvalid' })

const optionalNonNegativeInt = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().min(0).optional(),
)

// Native <select> elements submit "" when nothing is chosen, not undefined —
// preprocess it away so z.enum(...).optional() actually treats it as unset.
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val)
function optionalEnum<const T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional())
}

// Field order mirrors MEMBER_FORM.md's 10 sections exactly — firstNameFr,
// lastNameFr, firstNameAr, lastNameAr, photoUrl, address, phoneMobile and
// declarationAccepted are marked "Obligatoire" in the doc, everything else
// is optional.
export const memberFormSchema = z.object({
  // Section 1 — Informations personnelles
  firstNameFr: z.string().min(2, 'validation.required'),
  lastNameFr: z.string().min(2, 'validation.required'),
  firstNameAr: z.string().min(2, 'validation.required'),
  lastNameAr: z.string().min(2, 'validation.required'),
  photoUrl: z.string().min(1, 'validation.photoRequired'),
  gender: optionalEnum(['MALE', 'FEMALE']),
  fatherName: z.string().optional(),
  grandfatherName: z.string().optional(),
  motherFullName: z.string().optional(),

  // Section 2 — Naissance et identité
  birthDate: optionalDateString,
  birthPlace: z.string().optional(),
  cinNumber: z
    .string()
    .optional()
    .refine((val) => !val || cinRegex.test(val), { message: 'validation.cinInvalid' }),
  cinIssuedPlace: z.string().optional(),
  cinIssueDate: optionalDateString,

  // Section 3 — Coordonnées
  address: z.string().min(5, 'validation.required'),
  phoneHome: optionalPhone,
  phoneMobile: z.string().regex(phoneRegex, 'validation.phoneInvalid'),
  contactEmail: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'validation.emailInvalid',
    }),

  // Section 4 — Situation familiale
  maritalStatus: optionalEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  childrenCount: optionalNonNegativeInt,
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

  // Section 5 — Formation
  educationLevel: z.string().optional(),

  // Section 6 — Profession
  profession: z.string().optional(),
  speciality: z.string().optional(),
  employer: z.string().optional(),
  employerAddress: z.string().optional(),
  employerPhone: optionalPhone,
  workFax: z.string().optional(),

  // Section 7 — Expérience associative
  previousAssociations: z.string().optional(),

  // Section 8 — Activités sportives
  sports: z.string().optional(),

  // Section 9 — Secourisme
  firstAidCertificates: z.string().optional(),

  // Section 10 — Déclaration
  declarationAccepted: z.boolean().refine((val) => val === true, {
    message: 'validation.declarationRequired',
  }),
  declarationPlace: z.string().optional(),
  signature: z.string().optional(),
  signatureDate: optionalDateString,
})

export type MemberFormValues = z.infer<typeof memberFormSchema>

export const memberFormDefaultValues: MemberFormValues = {
  firstNameFr: '',
  lastNameFr: '',
  firstNameAr: '',
  lastNameAr: '',
  photoUrl: '',
  gender: undefined,
  fatherName: '',
  grandfatherName: '',
  motherFullName: '',
  birthDate: '',
  birthPlace: '',
  cinNumber: '',
  cinIssuedPlace: '',
  cinIssueDate: '',
  address: '',
  phoneHome: '',
  phoneMobile: '',
  contactEmail: '',
  maritalStatus: undefined,
  childrenCount: undefined,
  bloodType: undefined,
  educationLevel: '',
  profession: '',
  speciality: '',
  employer: '',
  employerAddress: '',
  employerPhone: '',
  workFax: '',
  previousAssociations: '',
  sports: '',
  firstAidCertificates: '',
  declarationAccepted: false,
  declarationPlace: '',
  signature: '',
  signatureDate: '',
}

export const TOTAL_STEPS = 8

// Shared between MemberFormPage (wizard) and the "Mon profil" edit page
// (single-page view of the same 8 sections) so the step order/labels never
// drift apart between the two.
export const stepLabelKeys = [
  'personalInfo',
  'identity',
  'contact',
  'family',
  'profession',
  'experience',
  'documents',
  'declaration',
] as const

export const stepFields: Record<number, (keyof MemberFormValues)[]> = {
  1: [
    'firstNameFr',
    'lastNameFr',
    'firstNameAr',
    'lastNameAr',
    'photoUrl',
    'gender',
    'fatherName',
    'grandfatherName',
    'motherFullName',
  ],
  2: ['birthDate', 'birthPlace', 'cinNumber', 'cinIssuedPlace', 'cinIssueDate'],
  3: ['address', 'phoneHome', 'phoneMobile', 'contactEmail'],
  4: ['maritalStatus', 'childrenCount', 'bloodType', 'educationLevel'],
  5: ['profession', 'speciality', 'employer', 'employerAddress', 'employerPhone', 'workFax'],
  6: ['previousAssociations', 'sports'],
  7: ['firstAidCertificates'],
  8: ['declarationAccepted', 'declarationPlace', 'signature', 'signatureDate'],
}
