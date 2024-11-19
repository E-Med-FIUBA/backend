export interface PrescriptionHash {
  professional: {
    fullName: string;
    professionSpecialty: string;
    license: string;
  };
  patient: {
    fullName: string;
    insurancePlan: string;
    birthDate: string;
    sex: string;
    dni: number;
  };
  prescription: {
    genericName: string;
    presentationName: string;
    pharmaceuticalForm: string;
    unitCount: number;
    diagnosis: string;
  };
  date: string;
}
