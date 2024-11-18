import { Module } from '@nestjs/common';
import { DoctorsTreeService } from './doctors-tree.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [DoctorsTreeService, PrismaService],
  exports: [DoctorsTreeService],
})
export class DoctorsTreeModule {}
