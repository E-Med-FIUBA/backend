import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PresentationsService {
  constructor(private prismaService: PrismaService) {}

  findAll() {
    return this.prismaService.presentation.findMany({
      distinct: ['name', 'drugId'],
      include: {
        drug: true,
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.presentation.findUnique({
      where: { id },
      include: {
        drug: true,
      },
    });
  }
}
