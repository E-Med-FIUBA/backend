import { Injectable } from '@nestjs/common';
import { Prescription } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { poseidon6 } from 'poseidon-lite';
import { TreeService } from 'src/models/tree.service';

@Injectable()
export class PrescriptionsTreeService extends TreeService {
  constructor(protected readonly prisma: PrismaService) {
    super('prescriptionNode', 'prescription', prisma);
  }

  hashData = (prescription: Prescription) =>
    poseidon6([
      prescription.id,
      prescription.doctorId,
      prescription.presentationId,
      prescription.patientId,
      prescription.quantity,
      prescription.emitedAt.getTime(),
    ]);
}
