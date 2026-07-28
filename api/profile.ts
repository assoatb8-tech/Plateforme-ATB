import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withAuth } from './_lib/middlewares/auth.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import {
  memberProfileInputSchema,
  type MemberProfileInput,
} from './_lib/validators/memberProfile.js'

function toProfileData(input: MemberProfileInput) {
  return {
    fullName: input.fullName,
    gender: input.gender,
    fatherName: input.fatherName || null,
    grandfatherName: input.grandfatherName || null,
    motherFullName: input.motherFullName || null,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
    birthPlace: input.birthPlace || null,
    cinNumber: input.cinNumber || null,
    cinIssuedPlace: input.cinIssuedPlace || null,
    cinIssueDate: input.cinIssueDate ? new Date(input.cinIssueDate) : null,
    address: input.address,
    phoneHome: input.phoneHome || null,
    phoneMobile: input.phoneMobile,
    contactEmail: input.contactEmail || null,
    maritalStatus: input.maritalStatus,
    childrenCount: input.childrenCount,
    bloodType: input.bloodType,
    educationLevel: input.educationLevel || null,
    profession: input.profession || null,
    speciality: input.speciality || null,
    employer: input.employer || null,
    employerAddress: input.employerAddress || null,
    employerPhone: input.employerPhone || null,
    workFax: input.workFax || null,
    previousAssociations: input.previousAssociations || null,
    sports: input.sports || null,
    firstAidCertificates: input.firstAidCertificates || null,
    declarationAccepted: input.declarationAccepted,
    declarationPlace: input.declarationPlace || null,
    signature: input.signature || null,
    signatureDate: input.signatureDate ? new Date(input.signatureDate) : null,
  }
}

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method === 'GET') {
    const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } })
    sendSuccess(res, profile)
    return
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    const parsed = memberProfileInputSchema.safeParse(req.body)
    if (!parsed.success) {
      sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
      return
    }

    const profileData = toProfileData(parsed.data)
    const profile = await prisma.memberProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...profileData },
      update: profileData,
    })

    sendSuccess(res, profile, 201)
    return
  }

  sendError(res, 'Method not allowed', 405)
})
