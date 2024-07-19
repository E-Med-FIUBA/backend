import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PatientDTO } from './dto/patient.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(data: PatientDTO) {
    const user = await this.usersService.create({ ...data, uid: null });
    return this.prisma.patient.create({
      data: {
        userId: user.id,
        doctorId: data.doctorId,
        birthDate: data.birthDate,
      },
    });
  }

  findAll() {
    return this.prisma.patient.findMany();
  }

  findOne(id: number) {
    return this.prisma.patient.findUnique({
      where: {
        id,
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
        user: true,
      },
    });
  }
}
