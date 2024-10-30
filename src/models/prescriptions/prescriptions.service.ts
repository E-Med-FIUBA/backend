import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { Prescription } from '@prisma/client';
import { poseidon3 } from 'poseidon-lite';
import { groth16 } from 'snarkjs';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/models/prescriptions-tree/prescriptions-tree.service';
import { ContractService, Proof } from '../contract/contract.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private doctorsTreeService: DoctorsTreeService,
    private prescriptionsTreeService: PrescriptionsTreeService,
    private contractService: ContractService,
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

        await this.contractService.updatePrescriptionsMerkleRoot(
          proofData.newRoot,
          proof,
        );

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

  update(id: number, data: PrescriptionDTO) {
    return this.prisma.prescription.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.prescription.delete({
      where: {
        id,
      },
    });
  }
}
