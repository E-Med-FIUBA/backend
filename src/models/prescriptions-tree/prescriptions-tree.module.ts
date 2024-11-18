import { Module } from '@nestjs/common';
import { PrescriptionsTreeService } from './prescriptions-tree.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [PrescriptionsTreeService, PrismaService],
  exports: [PrescriptionsTreeService],
})
export class PrescriptionsTreeModule {}
