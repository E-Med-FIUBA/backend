import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prescription } from '@prisma/client';
import { poseidon3 } from 'poseidon-lite';
import { groth16 } from 'snarkjs';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/models/prescriptions-tree/prescriptions-tree.service';
import { ContractService, Proof } from '../contract/contract.service';
import { SignatureService } from 'src/signature/signature.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrescriptionStagingTreeService } from '../prescription-staging-tree/prescription-staging-tree.service';

@Injectable()
export class PrescriptionsService {
  private isQueueProcessing = false;

  constructor(
    private prisma: PrismaService,
    private doctorsTreeService: DoctorsTreeService,
    private prescriptionsTreeService: PrescriptionsTreeService,
    private prescriptionsStagingTreeService: PrescriptionStagingTreeService,
    private contractService: ContractService,
    private signatureService: SignatureService,
  ) {}

  async create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(
      async (tx) => {
        const prescription = await tx.prescription.create({
          data: {
            emitedAt: data.emitedAt,
            quantity: data.quantity,
            presentationId: data.presentationId,
            indication: data.indication,
            doctorId: data.doctorId,
            patientId: data.patientId,
            signature: data.signature,
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

        const proofData = await this.prescriptionsStagingTreeService.createNode(
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
            prescription: {
              connect: {
                id: prescription.id,
              },
            },
          },
        });

        return prescription;
      },
      {
        timeout: 60000,
      },
    );
  }

  findAll() {
    return this.prisma.prescription.findMany();
  }

  findAllByDoctor(doctorId: number) {
    return this.prisma.prescription.findMany({
      where: {
        doctorId,
      },
      include: {
        presentation: {
          include: {
            drug: true,
          },
        },
        patient: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.prescription.findUnique({
      where: {
        id,
      },
    });
  }

  markAsUsed(id: number) {
    // TODO: Add "queue" check

    return this.prisma.$transaction(
      async (tx) => {
        const updatedPrescription = await tx.prescription.update({
          where: {
            id,
          },
          data: {
            used: true,
          },
        });

        if (process.env.DISABLE_BLOCKCHAIN) {
          return updatedPrescription;
        }

        const proofData = await this.prescriptionsStagingTreeService.markAsUsed(
          updatedPrescription,
          tx,
        );

        const { proof }: { proof: Proof } = await groth16.fullProve(
          proofData,
          'validium/update_validation.wasm',
          'validium/update_circuit_final.zkey',
        );

        await this.contractService.updatePrescriptionUsed(
          proofData.newRoot,
          proof,
        );

        return updatedPrescription;
      },
      {
        timeout: 60000,
      },
    );
  }

  async verify(id: number): Promise<Prescription> {
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
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    const drugId = prescription.presentation.drugId;
    const doctorId = prescription.doctorId;

    const data = {
      medicationId: drugId,
      presentation: prescription.presentationId,
      diagnosis: prescription.indication,
    };

    const isValid = await this.signatureService.verify(
      doctorId,
      JSON.stringify(data),
      prescription.signature,
    );

    if (!isValid) {
      throw new BadRequestException('Prescripcion invalida');
    }
    return prescription;
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue() {
    if (this.isQueueProcessing) {
      return;
    }
    this.isQueueProcessing = true;

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
      // Check if transaction is confirmed
      const isConfirmed = await this.contractService.isTransactionConfirmed(
        queueItem.transactionHash,
      );

      if (!isConfirmed) {
        break;
      }

      // Check if tx failed --> if so, revert staging tree

      // Remove from queue and update prescription merkle tree

      await this.prisma.$transaction(async (tx) => {
        await tx.prescriptionNodeQueue.delete({
          where: {
            id: queueItem.id,
          },
        });

        // TODO: Update prescription merkle tree according to "action" field
        await this.prescriptionsTreeService.createNode(
          queueItem.prescription,
          tx,
        );
      });

      console.log('created node for prescription', queueItem.prescription.id);
    }
    this.isQueueProcessing = false;
  }
}
