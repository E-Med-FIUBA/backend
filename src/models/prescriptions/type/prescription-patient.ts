export interface PrescriptionPatient {
  name: string;
  lastName: string;
  birthDate: Date;
  sex: string;
  dni: number;
  insuranceCompany: {
    name: string;
  };
}
