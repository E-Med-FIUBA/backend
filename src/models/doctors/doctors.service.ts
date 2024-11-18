import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Doctor, DoctorNodeQueue } from '@prisma/client';
import { PatientsService } from '../patients/patients.service';
import { groth16 } from 'snarkjs';
import { ContractService, Proof } from '../contract/contract.service';
import { PrismaTransactionalClient } from 'utils/types';
import { DoctorUpdateDTO } from './dto/doctor-update.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DoctorsTreeService } from '../doctors-tree/doctors-tree.service';
import { MailingService } from '../../mailing/mailing.service';
import { DoctorData } from '../../signature/signature.service';

@Injectable()
export class DoctorsService {
  private isQueueProcessing = false;

  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
    private doctorsTreeService: DoctorsTreeService,
    private contractService: ContractService,
    private mailingService: MailingService,
  ) {}

  async create(data: DoctorData, tx: PrismaTransactionalClient = this.prisma) {
    const doctor = await tx.doctor.create({
      data: {
        license: data.license,
        certificate: data.certificate,
        user: {
          connect: {
            id: data.userId,
          },
        },
        specialty: {
          connect: {
            id: data.specialtyId,
          },
        },
      },
    });

    if (process.env.DISABLE_BLOCKCHAIN) return doctor;

    const proofData = await this.doctorsTreeService.createNode(doctor, tx);

    const { proof }: { proof: Proof } = await groth16.fullProve(
      proofData,
      'validium/doctor_validation.wasm',
      'validium/doctor_circuit_final.zkey',
    );

    const txHash = await this.contractService.updateDoctorsMerkleRoot(
      proofData.newRoot,
      proof,
    );

    await tx.doctorNodeQueue.create({
      data: {
        transactionHash: txHash,
        doctor: {
          connect: {
            id: doctor.id,
          },
        },
      },
    });

    return doctor;
  }

  findAll(): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({
      where: {
        DoctorNodeQueue: null,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.doctor.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        specialty: true,
      },
    });
  }

  update(id: number, data: DoctorUpdateDTO): Promise<Doctor> {
    return this.prisma.doctor.update({
      where: {
        id,
      },
      data: {
        certificate: data.certificate,
        user: {
          update: {
            email: data.email,
            name: data.name,
            lastName: data.lastName,
            dni: data.dni,
          },
        },
        specialty: {
          connect: {
            id: data.specialtyId,
          },
        },
      },
    });
  }

  remove(id: number): Promise<Doctor> {
    return this.prisma.doctor.delete({
      where: {
        id,
      },
    });
  }

  getDoctorsPatients(id: number) {
    return this.patientsService.findDoctorPatients(id);
  }

  getDoctorByUserId(userId: number) {
    return this.prisma.doctor.findUnique({
      where: {
        userId,
      },
    });
  }

  private async regenerateTransactions() {
    const regenerationQueue = await this.prisma.doctorNodeQueue.findMany({
      where: {
        isRegeneration: true,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: 100,
    });

    for (const queueItem of regenerationQueue) {
      await this.prisma.$transaction(async (tx) => {
        await tx.doctorNodeQueue.delete({
          where: {
            id: queueItem.id,
          },
        });

        await this.create(
          {
            license: queueItem.doctor.license,
            userId: queueItem.doctor.userId,
            specialtyId: queueItem.doctor.specialtyId,
            certificate: queueItem.doctor.certificate,
            name: queueItem.doctor.user.name,
            lastName: queueItem.doctor.user.lastName,
          },
          tx,
        ); // Maybe reuse the same queueItem? Not sure if it affects
        console.log('Created node for doctor', queueItem.doctor.id);
      });
    }
  }

  private async revertQueue(
    queue: Array<
      DoctorNodeQueue & {
        doctor: Doctor;
      }
    >,
    fromId: number,
  ) {
    const itemsToRevert = queue.filter((item) => item.doctor.id >= fromId);
    await this.prisma.$transaction(async (tx) => {
      await this.revertStagingFrom(itemsToRevert, tx);
      const { doctor } = await tx.doctorNodeQueue.delete({
        where: {
          id: fromId,
        },
        select: {
          doctor: true,
        },
      });
      await tx.doctor.delete({
        where: {
          id: doctor.id,
        },
      });
      // Change existing tasks to regenerate proofs tasks in the queue
      await tx.doctorNodeQueue.updateMany({
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
    const queue = await this.prisma.doctorNodeQueue.findMany({
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
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
        console.log('Reverted node for doctor', queueItem.doctor.id);
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
        await tx.doctorNodeQueue.delete({
          where: {
            id: queueItem.id,
          },
        });
      });
      const email = queueItem.doctor.user.email;
      try {
        await this.mailingService.sendDoctorWelcomeMail(
          email,
          queueItem.doctor,
        );
      } catch (e) {
        console.error('Error sending welcome mail to doctor', email, e);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    if (this.isQueueProcessing || process.env.DISABLE_BLOCKCHAIN) {
      console.log('Doctor queue is already processing');
      return;
    }
    this.isQueueProcessing = true;

    await this.regenerateTransactions();

    console.log('Processing doctor queue');

    await this.processPendingTransactions();

    this.isQueueProcessing = false;
  }

  private async revertStagingFrom(
    itemsToRevert: DoctorNodeQueue[],
    tx: PrismaTransactionalClient,
  ) {
    itemsToRevert.reverse();
    for (const item of itemsToRevert) {
      await this.doctorsTreeService.deleteNode(item.doctorId, tx);
    }
  }

  async isActiveDoctor(doctorId: number) {
    const doctor = await this.prisma.doctorNodeQueue.findFirst({
      where: {
        doctorId,
      },
    });
    return doctor === null;
  }
}
