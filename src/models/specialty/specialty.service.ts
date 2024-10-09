import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SpecialtyService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.specialty.findMany();
  }
}
