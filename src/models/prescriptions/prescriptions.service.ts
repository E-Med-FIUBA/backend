import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PrescriptionDTO } from './dto/prescription.dto';
import { Prescription } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  create(data: Omit<Prescription, 'id'>) {
    return this.prisma.prescription.create({
      data,
    });
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
        drug: true,
        patient: {
          include: {
            user: true,
          },
        },
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
