import { Injectable, NotFoundException } from '@nestjs/common';
import { Prescription } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { poseidon7 } from 'poseidon-lite';
import { splitKey, TreeService } from 'src/models/tree.service';
import { PrismaTransactionalClient } from 'utils/types';

interface UpdateProofGenerationData {
  oldRoot: bigint;
  newRoot: bigint;
  siblings: bigint[];
  isOld0: number;
  oldKey: number;
  oldValue: bigint;
  key: number;
  id: number;
  doctorId: number;
  presentationId: number;
  patientId: number;
  quantity: number;
  emitedAt: number;
  [key: string]: any;
}

@Injectable()
export class PrescriptionsTreeService extends TreeService {
  constructor(protected readonly prisma: PrismaService) {
    super('prescriptionNode', 'prescription', prisma);
  }

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
    console.log(updatedPrescriptionNode.parent);
    if (!updatedPrescriptionNode.parent) {
      newRootHash = BigInt(updatedPrescriptionNode.hash);
    } else {
      newRootHash = await this.updateHashes(updatedPrescriptionNode.parent, tx);
    }

    console.log({
      isOld0: 0,
      oldRoot: BigInt(oldRoot.hash),
      newRoot: newRootHash,
      siblings,
      key: updatedPrescriptionNode.key,
      doctorId: prescription.doctorId,
      id: prescription.id,
      patientId: prescription.patientId,
      presentationId: prescription.presentationId,
      quantity: prescription.quantity,
      emitedAt: prescription.emitedAt.getTime(),
      oldKey: oldNode.key,
      oldValue: this.hashData({ ...prescription, used: false }), // TODO: Check for another way of getting the old value
    });

    return {
      isOld0: 0,
      oldRoot: BigInt(oldRoot.hash),
      newRoot: newRootHash,
      siblings,
      key: updatedPrescriptionNode.key,
      doctorId: prescription.doctorId,
      id: prescription.id,
      patientId: prescription.patientId,
      presentationId: prescription.presentationId,
      quantity: prescription.quantity,
      emitedAt: prescription.emitedAt.getTime(),
      oldKey: oldNode.key,
      oldValue: this.hashData({ ...prescription, used: false }), // TODO: Check for another way of getting the old value
    };
  }
}
