import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Doctor } from '@prisma/client';
import { DoctorDTO } from './dto/doctor.dto';
import { PatientsService } from '../patients/patients.service';

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
