import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  Prescription,
  PrescriptionNode,
  PrescriptionNodeQueue,
  QueueAction,
} from '@prisma/client';
import { poseidon3 } from 'poseidon-lite';
import { groth16 } from 'snarkjs';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/models/prescriptions-tree/prescriptions-tree.service';
import { ContractService, Proof } from '../contract/contract.service';
import { SignatureService } from 'src/signature/signature.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaTransactionalClient } from 'utils/types';
import { MailingService } from 'src/mailing/mailing.service';

@Injectable()
export class PrescriptionsService {
  private isQueueProcessing = false;

  constructor(
    private prisma: PrismaService,
    private doctorsTreeService: DoctorsTreeService,
    private prescriptionsTreeService: PrescriptionsTreeService,
    private contractService: ContractService,
    private mailingService: MailingService,
    private signatureService: SignatureService,
  ) { }

  create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(
      (tx) => {
        return this.createAux(data, tx);
      },
      {
        timeout: 20000,
      },
    );
  }

  private async createAux(
    data: Omit<Prescription, 'id'>,
    tx: PrismaTransactionalClient = this.prisma,
  ) {
    const prescription = await tx.prescription.create({
      data: {
        emitedAt: data.emitedAt,
        quantity: data.quantity,
        indication: data.indication,
        doctor: {
          connect: { id: data.doctorId }
        },
        patient: {
          connect: { id: data.patientId }
        },
        signature: data.signature,
        usedAt: null,
        presentation: {
          connect: { id: data.presentationId }
        }
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        patient: {
          include: {
            insuranceCompany: true,
          },
        },
        doctor: {
          include: {
            user: true,
            specialty: true,
          },
        },
      },
    });

    if (process.env.DISABLE_BLOCKCHAIN) {
      return prescription;
    }

    const doctorRoot = await this.doctorsTreeService.getRoot(tx);
    if (!doctorRoot) {
      throw new Error('Doctor tree not initialized');
    }

    const doctor = await tx.doctor.findUnique({
      where: {
        id: data.doctorId,
      },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const doctorSiblings = await this.doctorsTreeService.getSiblings(
      data.doctorId,
      tx,
    );

    const proofData = await this.prescriptionsTreeService.createNode(
      prescription,
      tx,
    );

    const { proof }: { proof: Proof } = await groth16.fullProve(
      {
        ...proofData,
        doctorRoot: BigInt(doctorRoot.hash),
        doctorSiblings: doctorSiblings,
        doctorKey: data.doctorId,
        doctorValue: poseidon3([doctor.id, doctor.license, doctor.userId]),
      },
      'validium/prescription_validation.wasm',
      'validium/prescription_circuit_final.zkey',
    );

    const txHash = await this.contractService.updatePrescriptionsMerkleRoot(
      proofData.newRoot,
      proof,
    );

    await tx.prescriptionNodeQueue.create({
      data: {
        transactionHash: txHash,
        action: QueueAction.CREATE,
        prescription: {
          connect: {
            id: prescription.id,
          },
        },
      },
    });

    return prescription;
  }

  findAll() {
    return this.prisma.prescription.findMany();
  }

  findAllByDoctor(doctorId: number) {
    return this.prisma.prescription.findMany({
      where: {
        doctorId,
        prescriptionNodeQueue: null,
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        patient: {
          include: {
            insuranceCompany: true,
          },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.prescription.findUnique({
      where: {
        id: id,
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        patient: {
          include: {
            insuranceCompany: true,
          },
        },
        doctor: {
          include: {
            user: true,
            specialty: true,
          },
        },
      }
    });
  }

  markAsUsed(id: number, pharmacistId: number) {
    if (!this.isActivePrescription(id)) {
      throw new BadRequestException('Prescription is being processed');
    }

    return this.prisma.$transaction(
      async (tx) => {
        return this.markAsUsedAux(id, pharmacistId, tx);
      },
      {
        timeout: 20000,
      },
    );
  }

  private async markAsUsedAux(
    id: number,
    pharmacistId: number,
    tx: PrismaTransactionalClient = this.prisma,
  ) {
    const updatedPrescription = await tx.prescription.update({
      where: {
        id,
      },
      data: {
        used: true,
        pharmacistId,
        usedAt: new Date(),
      },
    });

    if (process.env.DISABLE_BLOCKCHAIN) {
      return updatedPrescription;
    }

    const proofData = await this.prescriptionsTreeService.markAsUsed(
      updatedPrescription,
      tx,
    );

    const { proof }: { proof: Proof } = await groth16.fullProve(
      proofData,
      'validium/update_validation.wasm',
      'validium/update_circuit_final.zkey',
    );

    const txHash = await this.contractService.updatePrescriptionUsed(
      proofData.newRoot,
      proof,
    );

    await tx.prescriptionNodeQueue.create({
      data: {
        transactionHash: txHash,
        action: QueueAction.UPDATE,
        prescription: {
          connect: {
            id: updatedPrescription.id,
          },
        },
      },
    });

    return updatedPrescription;
  }

  async verify(id: number): Promise<Prescription> {
    if (!this.isActivePrescription(id)) {
      throw new BadRequestException('Prescription is being processed');
    }

    const prescription = await this.prisma.prescription.findUnique({
      where: {
        id,
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        prescriptionNodes: true,
        doctor: {
          select: {
            id: true,
            license: true,
            user: {
              select: {
                name: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        patient: true
      },
    });

    const drugId = prescription.presentation.drugId;
    const doctorId = prescription.doctorId;

    const data = {
      medicationId: drugId,
      presentation: prescription.presentationId,
      diagnosis: prescription.indication,
    };

    if (!process.env.DISABLE_BLOCKCHAIN) {
      const prescriptionNode = prescription.prescriptionNodes[0]; // TODO: Restrict to only one node
      if (!prescriptionNode) {
        throw new BadRequestException('Prescripcion invalida');
      }
      const isValidOnChain = await this.verifyOnChain(prescriptionNode);
      if (!isValidOnChain) {
        throw new BadRequestException('Prescripcion invalida');
      }
      console.log('Prescription is valid on chain');
    }

    // const isValid = await this.signatureService.verify(
    //   doctorId,
    //   JSON.stringify(data),
    //   prescription.signature,
    // );

    // if (!isValid) {
    //   throw new BadRequestException('Prescripcion invalida');
    // }
    return prescription;
  }

  findAllByPharmacist(pharmacistId: number) {
    return this.prisma.prescription.findMany({
      where: {
        pharmacistId,
        prescriptionNodeQueue: null,
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        patient: {
          include: {
            insuranceCompany: true,
          },
        },
        doctor: {
          select: {
            id: true,
            license: true,
            user: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        usedAt: 'desc',
      },
    });
  }

  private async verifyOnChain(
    prescriptionNode: PrescriptionNode,
  ): Promise<boolean> {
    const proofData = await this.prescriptionsTreeService.verifyNode(
      prescriptionNode.key,
    );
    const { proof } = await groth16.fullProve(
      proofData,
      'validium/merkle_inclusion_validation.wasm',
      'validium/merkle_inclusion_circuit_final.zkey',
    );

    const isValidOnChain = await this.contractService.verifyPrescription(
      proofData.key,
      proofData.value,
      proof,
    );

    console.log('isValidOnChain', isValidOnChain);

    return isValidOnChain;
  }

  private async regenerateTransactions() {
    const regenerationQueue = await this.prisma.prescriptionNodeQueue.findMany({
      where: {
        isRegeneration: true,
      },
      include: {
        prescription: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: 100,
    });

    for (const queueItem of regenerationQueue) {
      await this.prisma.$transaction(async (tx) => {
        await tx.prescriptionNodeQueue.delete({
          where: {
            id: queueItem.id,
          },
        });

        // Update tree
        if (queueItem.action === QueueAction.UPDATE) {
          await this.markAsUsed(
            queueItem.prescription.id,
            queueItem.prescription.pharmacistId,
          ); // Maybe reuse the same queueItem? Not sure if it affects. TODO: Add TX support
          console.log(
            'Updated node for prescription',
            queueItem.prescription.id,
          );
        } else if (queueItem.action === QueueAction.CREATE) {
          await this.createAux(queueItem.prescription, tx); // Maybe reuse the same queueItem? Not sure if it affects. TODO: Add TX support
          console.log(
            'Created node for prescription',
            queueItem.prescription.id,
          );
        } else {
          console.error('Unknown queue action', queueItem.action);
        }
      });
    }
  }

  private async revertQueue(
    queue: Array<
      PrescriptionNodeQueue & {
        prescription: Prescription;
      }
    >,
    fromId: number,
  ) {
    const itemsToRevert = queue.filter(
      (item) => item.prescription.id >= fromId,
    );
    await this.prisma.$transaction(async (tx) => {
      await this.revertStagingFrom(itemsToRevert, tx);
      const { prescription } = await tx.prescriptionNodeQueue.delete({
        where: {
          id: fromId,
        },
        select: {
          prescription: true,
        },
      });
      await tx.prescription.delete({
        where: {
          id: prescription.id,
        },
      });
      // Change existing tasks to regenerate proofs tasks in the queue
      await tx.prescriptionNodeQueue.updateMany({
        where: {
          id: {
            gt: fromId,
          },
        },
        data: {
          transactionHash: null,
          isRegeneration: true,
        },
      });
    });
  }

  async processPendingTransactions() {
    const queue = await this.prisma.prescriptionNodeQueue.findMany({
      include: {
        prescription: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: 100,
    });

    for (const queueItem of queue) {
      // Check if tx failed. If so, revert staging tree
      const txFailed = await this.contractService.isTransactionFailed(
        queueItem.transactionHash,
      );
      if (txFailed) {
        await this.revertQueue(queue, queueItem.id);
        console.log(
          'Reverted node for prescription',
          queueItem.prescription.id,
        );
        break;
      }

      // Check if transaction is confirmed
      const isFinished = await this.contractService.isTransactionFinished(
        queueItem.transactionHash,
      );
      if (!isFinished) {
        break;
      }

      // Update main tree
      await this.prisma.$transaction(async (tx) => {
        await tx.prescriptionNodeQueue.delete({
          where: {
            id: queueItem.id,
          },
        });
        this.sendPrescription(queueItem.prescription.id);
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    if (this.isQueueProcessing || process.env.DISABLE_BLOCKCHAIN) {
      console.log('Prescription queue is already processing');
      return;
    }
    this.isQueueProcessing = true;

    await this.regenerateTransactions();

    console.log('Processing prescription queue');

    await this.processPendingTransactions();

    this.isQueueProcessing = false;
  }

  private async revertStagingFrom(
    itemsToRevert: PrescriptionNodeQueue[],
    tx: PrismaTransactionalClient,
  ) {
    itemsToRevert.reverse();
    for (const item of itemsToRevert) {
      if (item.action === QueueAction.UPDATE) {
        await this.prescriptionsTreeService.markAsUnused(
          item.prescriptionId,
          tx,
        );
      } else if (item.action === QueueAction.CREATE) {
        await this.prescriptionsTreeService.deleteNode(item.prescriptionId, tx);
      } else {
        console.error('Unknown queue action', item.action);
      }
    }
  }

  private async sendPrescription(prescriptionId: number) {
    const prescription = await this.prisma.prescription.findUnique({
      where: {
        id: prescriptionId,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        presentation: {
          include: {
            drug: true,
          },
        },
      },
    });

    const doctor = prescription.doctor;
    const patient = prescription.patient;
    const email = patient.email;

    this.mailingService.sendPrescription(email, patient, doctor, prescription);
  }

  async isActivePrescription(prescriptionId: number) {
    const prescription = await this.prisma.prescriptionNodeQueue.findFirst({
      where: {
        prescriptionId,
      },
    });
    return prescription === null;
  }
}
