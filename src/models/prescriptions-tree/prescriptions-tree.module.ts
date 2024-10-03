import { Module } from '@nestjs/common';
import { PrescriptionsTreeService } from './prescriptions-tree.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [PrescriptionsTreeService, PrismaService],
  exports: [PrescriptionsTreeService],
})
export class PrescriptionsTreeModule {}
