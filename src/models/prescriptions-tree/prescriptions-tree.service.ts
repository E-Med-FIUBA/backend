import { Injectable, NotFoundException } from '@nestjs/common';
import { Prescription } from '@prisma/client';
import { poseidon7 } from 'poseidon-lite';
import {
  PrismaTransactionalClient,
  UpdateProofGenerationData,
} from 'utils/types';
import { splitKey, TreeService } from '../tree.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PrescriptionsTreeService extends TreeService {
  constructor(protected readonly prisma: PrismaService) {
    super('prescriptionNode', 'prescription', prisma);
  }

  // TODO: Hash more data
  hashData = (prescription: Prescription) =>
    poseidon7([
      prescription.id,
      prescription.doctorId,
      prescription.presentationId,
      prescription.patientId,
      prescription.quantity,
      prescription.emitedAt.getTime(),
      prescription.used ? 1 : 0,
    ]);

  async markAsUsed(
    prescription: Prescription,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<UpdateProofGenerationData> {
    const oldRoot = await this.getRoot(tx);

    const prescriptionNode = await tx.prescriptionNode.findFirst({
      where: { prescription: { id: prescription.id } },
    });

    if (!prescriptionNode) {
      throw new NotFoundException(
        `Prescription node for ${prescription.id} not found`,
      );
    }

    const { siblings, oldNode } = await this.getSiblingsAndOldNode(
      oldRoot,
      splitKey(prescriptionNode.key),
      tx,
    );

    const hashedValue = this.hashData({ ...prescription, used: true });

    const updatedPrescriptionNode = await tx.prescriptionNode.update({
      where: { id: prescriptionNode.id },
      data: {
        hash: this.hash1(prescriptionNode.key, hashedValue).toString(),
      },
      include: {
        parent: true,
      },
    });

    let newRootHash: bigint;
    if (!updatedPrescriptionNode.parent) {
      newRootHash = BigInt(updatedPrescriptionNode.hash);
    } else {
      newRootHash = await this.updateHashes(updatedPrescriptionNode.parent, tx);
    }

    return {
      oldRoot: BigInt(oldRoot.hash),
      newRoot: newRootHash,
      siblings,
      key: updatedPrescriptionNode.key,
      doctorId: prescription.doctorId,
      patientId: prescription.patientId,
      presentationId: prescription.presentationId,
      quantity: prescription.quantity,
      emitedAt: prescription.emitedAt.getTime(),
      oldKey: oldNode.key,
      oldValue: this.hashData({ ...prescription, used: false }), // TODO: Check for another way of getting the old value
    };
  }

  async markAsUnused(
    prescriptionId: number,
    tx: PrismaTransactionalClient = this.prisma,
  ) {
    const prescriptionNode = await tx.prescriptionNode.findFirst({
      where: { prescription: { id: prescriptionId } },
      include: {
        prescription: true,
      },
    });

    if (!prescriptionNode) {
      throw new NotFoundException(
        `Prescription node for ${prescriptionId} not found`,
      );
    }

    const hashedValue = this.hashData({
      ...prescriptionNode.prescription,
      used: false,
    });

    const updatedPrescriptionNode = await tx.prescriptionNode.update({
      where: { id: prescriptionNode.id },
      data: {
        hash: this.hash1(prescriptionNode.key, hashedValue).toString(),
      },
      include: {
        parent: true,
      },
    });

    if (updatedPrescriptionNode.parent) {
      await this.updateHashes(updatedPrescriptionNode.parent, tx);
    }
  }
}
