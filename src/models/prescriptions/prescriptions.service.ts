import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { ChildSide, Prescription } from '@prisma/client';
import { poseidon2, poseidon3, poseidon9 } from 'poseidon-lite';
import * as snarkjs from 'snarkjs';
import { DoctorsTreeService } from 'src/doctors-tree/doctors-tree.service';
import { PrescriptionsTreeService } from 'src/prescriptions-tree/prescriptions-tree.service';

const keyLength = 4; // key length in bits

const padArray = <T>(arr: Array<T>, length: number, paddingValue: T) => {
  return arr.concat(Array(length - arr.length).fill(paddingValue));
};

const splitKey = (_key: number) => {
  const key = _key
    .toString(2)
    .split('')
    .map((x) => x === '1')
    .reverse();
  return padArray(key, keyLength, false);
};

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private doctorsTreeService: DoctorsTreeService,
    private prescriptionsTreeService: PrescriptionsTreeService,
  ) {}

  async create(data: Omit<Prescription, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
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
        throw new Error('Doctor not found');
      }

      const doctorSiblings = await this.doctorsTreeService.getSiblings(
        data.doctorId,
        tx,
      );

      const prescription = await tx.prescription.create({
        data,
      });

      const proofData = await this.prescriptionsTreeService.createNode(
        prescription,
        tx,
      );
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
          ...proofData,
          doctorRoot: BigInt(doctorRoot.hash),
          doctorSiblings: doctorSiblings,
          doctorKey: data.doctorId,
          doctorValue: poseidon3([doctor.id, doctor.license, doctor.userId]),
        },
        'prescription_validation.wasm',
        'prescription_circuit_final.zkey',
      );

      return prescription;
    });
  }

  findAll() {
    return this.prisma.prescription.findMany();
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
