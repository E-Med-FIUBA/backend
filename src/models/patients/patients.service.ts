import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PatientDTO } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: PatientDTO) {
    return this.prisma.patient.create({
      data,
    });
  }

  findAll() {
    return this.prisma.patient.findMany();
  }

  findAllByDoctor(doctorId: number) {
    return this.prisma.patient.findMany({
      where: {
        doctorId,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.patient.findUnique({
      where: {
        id,
      },
      include: {
        insurancePlan: {
          include: {
            insuranceCompany: true,
          },
        },
      },
    });
  }

  update(id: number, data: PatientDTO) {
    return this.prisma.patient.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.patient.delete({
      where: {
        id,
      },
    });
  }

  findDoctorPatients(id: number) {
    return this.prisma.patient.findMany({
      where: {
        doctorId: id,
      },
      include: {
        insurancePlan: true,
      },
    });
  }
}
