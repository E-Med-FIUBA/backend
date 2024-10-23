import { BadRequestException, Injectable } from '@nestjs/common';
import { Prescription } from '@prisma/client';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { DoctorsService } from '../doctors/doctors.service';
import { createVerify, X509Certificate } from 'node:crypto';

@Injectable()
export class SignatureService {
  constructor(private readonly doctorService: DoctorsService, private readonly prescriptionService: PrescriptionsService) { }

  async verify(prescriptionId: number): Promise<Prescription> {
    const prescription = await this.prescriptionService.findOne(prescriptionId);
    const doctor = await this.doctorService.findOne(prescription.doctorId);

    if (!doctor.certificate) {
      throw new BadRequestException('El doctor todavia no tiene la certificacion');
    }

    if (!prescription.signature) {
      throw new BadRequestException('La prescripcion no tiene firma');
    }

    const verify = createVerify('SHA256');

    // Cambiar a otra verificacion
    verify.update(prescription.id.toString());
    verify.end();


    const x509 = new X509Certificate(doctor.certificate);

    const publicKey = x509.publicKey;

    const isValid = verify.verify(publicKey, prescription.signature);

    if (!isValid) {
      throw new BadRequestException("Prescripcion invalida");
    }

    return prescription;
  }
}
