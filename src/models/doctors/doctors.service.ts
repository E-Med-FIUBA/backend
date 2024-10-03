import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Doctor } from '@prisma/client';
import { DoctorDTO } from './dto/doctor.dto';
import { PatientsService } from '../patients/patients.service';
import * as snarkjs from 'snarkjs';
import { DoctorsTreeService } from 'src/doctors-tree/doctors-tree.service';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
    private doctorsTreeService: DoctorsTreeService,
  ) {}

  create(data: Omit<Doctor, 'id'>) {
    return this.prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.create({
        data,
      });

      const proofData = await this.doctorsTreeService.createNode(doctor, tx);

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        proofData,
        'validium/doctor_validation.wasm',
        'validium/doctor_circuit_final.zkey',
      );

      return doctor;
    });
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

  update(id: number, data: DoctorDTO): Promise<Doctor> {
    return this.prisma.doctor.update({
      where: {
        id,
      },
      data,
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
