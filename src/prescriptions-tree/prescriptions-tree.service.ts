import { Injectable } from '@nestjs/common';
import { Prescription } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { poseidon9 } from 'poseidon-lite';
import { TreeService } from 'src/tree.service';

@Injectable()
export class PrescriptionsTreeService extends TreeService {
  constructor(protected readonly prisma: PrismaService) {
    super('prescriptionNode', 'prescription', prisma);
  }

  hashData = (prescription: Prescription) =>
    poseidon9([
      prescription.id,
      prescription.doctorId,
      prescription.drugId,
      prescription.patientId,
      prescription.quantity,
      prescription.startDate.getTime(),
      prescription.endDate.getTime(),
      prescription.duration,
      prescription.frequency,
    ]);
}
