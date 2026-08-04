export interface BureauMemberDto {
  id: string
  firstNameFr: string
  lastNameFr: string
  firstNameAr: string
  lastNameAr: string
  phone: string
  email: string
  positionFr: string | null
  positionAr: string | null
  facebookUrl: string
  photoUrl: string | null
  createdAt: string
}
