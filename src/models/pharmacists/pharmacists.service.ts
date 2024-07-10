import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PharmacistDTO } from './dto/pharmacist.dto';
import { Pharmacist } from '@prisma/client';

@Injectable()
export class PharmacistsService {
  constructor(private prisma: PrismaService) {}

  create(data: Omit<Pharmacist, 'id'>) {
    return this.prisma.pharmacist.create({
      data,
    });
  }

  findAll(): Promise<Pharmacist[]> {
    return this.prisma.pharmacist.findMany();
  }

  findOne(id: number): Promise<Pharmacist> {
    return this.prisma.pharmacist.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, data: PharmacistDTO): Promise<Pharmacist> {
    return this.prisma.pharmacist.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number): Promise<Pharmacist> {
    return this.prisma.pharmacist.delete({
      where: {
        id,
      },
    });
  }
}
