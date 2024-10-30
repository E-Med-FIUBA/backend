import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Doctor } from '@prisma/client';
import { PatientsService } from '../patients/patients.service';
import { groth16 } from 'snarkjs';
import { DoctorsTreeService } from 'src/models/doctors-tree/doctors-tree.service';
import { ContractService, Proof } from '../contract/contract.service';
import { PrismaTransactionalClient } from 'utils/types';
import { DoctorUpdateDTO } from './dto/doctor-update.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
    private doctorsTreeService: DoctorsTreeService,
    private contractService: ContractService,
  ) { }

  async create(
    data: Omit<Doctor, 'id'>,
    tx: PrismaTransactionalClient = this.prisma,
  ) {
    const doctor = await tx.doctor.create({
      data: {
        license: data.license,
        certificateRequest: data.certificateRequest,
        privateKey: data.privateKey,
        user: {
          connect: {
            id: data.userId
          }
        },
        specialty: {
          connect: {
            id: data.specialtyId
          }
        }
      },
    });

    if (process.env.DISABLE_BLOCKCHAIN) return doctor;

    const proofData = await this.doctorsTreeService.createNode(doctor, tx);

    const { proof }: { proof: Proof } = await groth16.fullProve(
      proofData,
      'validium/doctor_validation.wasm',
      'validium/doctor_circuit_final.zkey',
    );

    await this.contractService.updateDoctorsMerkleRoot(
      proofData.newRoot,
      proof,
    );


    return doctor;
  }

  findAll(): Promise<Doctor[]> {
    return this.prisma.doctor.findMany();
  }

  findOne(id: number): Promise<Doctor> {
    return this.prisma.doctor.findUnique({
      where: {
        id,
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
}
