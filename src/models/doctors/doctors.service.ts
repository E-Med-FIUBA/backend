import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Doctor } from '@prisma/client';
import { PatientsService } from '../patients/patients.service';
import { DoctorUpdateDTO } from './dto/doctor-update.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
  ) {}

  create(data: Omit<Doctor, 'id'>) {
    return this.prisma.doctor.create({
      data,
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

  update(id: number, data: DoctorUpdateDTO): Promise<Doctor> {
    console.log(data);

    return this.prisma.doctor.update({
      where: {
        id,
      },
      data: {
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
