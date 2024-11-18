import {
  Doctor,
  Drug,
  InsuranceCompany,
  Patient,
  Prescription,
  Presentation,
  Specialty,
  User,
} from '@prisma/client';

export type VerifiedPrescription = Prescription & {
  doctor: Doctor & { user: User; specialty: Specialty };
  presentation: Presentation & { drug: Drug };
  patient: Patient & { insuranceCompany: InsuranceCompany };
};
