import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class InsuranceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.insuranceCompany.findMany();
  }

  findOne(id: number) {
    return this.prisma.insuranceCompany.findUnique({
      where: {
        id,
      },
    });
  }
}
