export interface PrescriptionPatient {
  name: string;
  lastName: string;
  birthDate: string;
  sex: string;
  dni: number;
  insuranceCompany: {
    name: string;
  };
}
